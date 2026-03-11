<?php

namespace Tests\Feature;

use App\Constants\Status;
use App\Models\Hardware;
use App\Repositories\HardwareRepository;
use App\Services\HardwareUpdateService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\Group;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * Uses DatabaseTransactions — runs against your REAL database.
 * Every test is wrapped in a transaction and rolled back after,
 * so no data is permanently written. Safe to run on the real DB.
 *
 * Strategy: since real data already exists, tests assert RELATIVE
 * behavior (next number after current max, correct prefix, increments
 * by 1) rather than hardcoded values like 001.
 *
 * Run all:     php artisan test tests/Feature/HardwareHostnameTest.php
 * Run one:     php artisan test --filter it_generates_desktop_hostname_when_not_provided
 * Run verbose: php artisan test tests/Feature/HardwareHostnameTest.php --verbose
 */
#[Group('hardware')]
class HardwareHostnameTest extends TestCase
{
    use DatabaseTransactions;

    private HardwareUpdateService $service;
    private HardwareRepository    $repo;

    // Minimal valid payload
    private array $base = [
        'brand'  => 'Dell',
        'model'  => 'Test Model',
        'status' => 1,
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(HardwareUpdateService::class);
        $this->repo    = app(HardwareRepository::class);
    }

    // =========================================================================
    // HELPERS — read current DB state before asserting
    // =========================================================================

    /**
     * Get the next expected number for a prefix based on what's already in DB.
     * Mirrors exactly what getNextHostnameNumber() does in the repo.
     */
    private function expectedNextNumber(string $prefix): int
    {
        return $this->repo->getNextHostnameNumber($prefix);
    }

    /** Build the full expected hostname string */
    private function expectedHostname(string $prefix): string
    {
        return $prefix . str_pad($this->expectedNextNumber($prefix), 3, '0', STR_PAD_LEFT);
    }

    // =========================================================================
    // GROUP 1 — Auto hostname generation (no hostname in payload)
    // =========================================================================

    #[Test]
    public function it_generates_desktop_hostname_when_not_provided(): void
    {
        // Snapshot what the next hostname SHOULD be before we create
        $expected = $this->expectedHostname('TSPI-PC-');
        dump("Next expected hostname: {$expected}");
        $hw = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop']),
            employeeId: 1
        );
        dump("Actually generated: {$hw->hostname}");
        $this->assertSame($expected, $hw->hostname);
        $this->assertStringStartsWith('TSPI-PC-', $hw->hostname);
        $this->assertDatabaseHas('hardware', ['hostname' => $expected]);
    }

    #[Test]
    public function it_generates_laptop_hostname_when_not_provided(): void
    {
        $expected = $this->expectedHostname('TSPI-LAP-');
        dump("Next expected hostname: {$expected}");
        $hw = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Laptop']),
            employeeId: 1
        );
        dump("Actually generated: {$hw->hostname}");
        $this->assertSame($expected, $hw->hostname);
        $this->assertStringStartsWith('TSPI-LAP-', $hw->hostname);
        $this->assertDatabaseHas('hardware', ['hostname' => $expected]);
    }

    #[Test]
    public function it_generates_promis_terminal_hostname_when_not_provided(): void
    {
        $expected = $this->expectedHostname('TELFORD-W');
        dump("Next expected hostname: {$expected}");
        $hw = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Promis Terminal']),
            employeeId: 1
        );
        dump("Actually generated: {$hw->hostname}");
        $this->assertSame($expected, $hw->hostname);
        $this->assertStringStartsWith('TELFORD-W', $hw->hostname);
        $this->assertDatabaseHas('hardware', ['hostname' => $expected]);
    }

    #[Test]
    public function it_increments_hostname_sequentially_for_same_category(): void
    {
        // Capture the starting number before any inserts
        $startingNumber = $this->expectedNextNumber('TSPI-PC-');

        dump("Starting from number: {$startingNumber}");

        $hw1 = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop']),
            employeeId: 1
        );
        $hw2 = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop']),
            employeeId: 1
        );
        $hw3 = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop']),
            employeeId: 1
        );

        dump("Generated 1st: {$hw1->hostname}");
        dump("Generated 2nd: {$hw2->hostname}");
        dump("Generated 3rd: {$hw3->hostname}");

        $expected1 = 'TSPI-PC-' . str_pad($startingNumber,     3, '0', STR_PAD_LEFT);
        $expected2 = 'TSPI-PC-' . str_pad($startingNumber + 1, 3, '0', STR_PAD_LEFT);
        $expected3 = 'TSPI-PC-' . str_pad($startingNumber + 2, 3, '0', STR_PAD_LEFT);

        dump("Expected 1st: {$expected1}");
        dump("Expected 2nd: {$expected2}");
        dump("Expected 3rd: {$expected3}");

        $this->assertSame($expected1, $hw1->hostname);
        $this->assertSame($expected2, $hw2->hostname);
        $this->assertSame($expected3, $hw3->hostname);
    }
    #[Test]
    public function it_generates_independently_per_category(): void
    {
        $expectedDesktop  = $this->expectedHostname('TSPI-PC-');
        $expectedLaptop   = $this->expectedHostname('TSPI-LAP-');
        $expectedTerminal = $this->expectedHostname('TELFORD-W');

        $desktop  = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop']),
            employeeId: 1
        );
        $laptop   = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Laptop']),
            employeeId: 1
        );
        $terminal = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Promis Terminal']),
            employeeId: 1
        );

        // Each category has its own independent counter
        $this->assertSame($expectedDesktop,  $desktop->hostname);
        $this->assertSame($expectedLaptop,   $laptop->hostname);
        $this->assertSame($expectedTerminal, $terminal->hostname);
    }

    #[Test]
    public function it_skips_retired_hostnames_and_does_not_reuse_them(): void
    {
        // Get what the next number would be now
        $nextNumber = $this->expectedNextNumber('TSPI-PC-');

        // Force-create a record AT that next number with inactive status
        // simulating a retired machine occupying that slot
        Hardware::factory()
            ->desktop()
            ->inactive()
            ->withHostname('TSPI-PC-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT))
            ->create();

        // Now generate — should skip the retired one and go to nextNumber + 1
        $hw = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop']),
            employeeId: 1
        );

        $expected = 'TSPI-PC-' . str_pad($nextNumber + 1, 3, '0', STR_PAD_LEFT);
        $this->assertSame($expected, $hw->hostname);
    }

    #[Test]
    public function it_pads_hostname_number_to_three_digits(): void
    {
        // Verify the generated hostname always has 3-digit zero-padded suffix
        $hw = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop']),
            employeeId: 1
        );

        // Extract suffix after prefix and assert it is exactly 3 digits
        $suffix = substr($hw->hostname, strlen('TSPI-PC-'));
        $this->assertMatchesRegularExpression('/^\d{3}$/', $suffix);
    }

    // =========================================================================
    // GROUP 2 — Provided hostname (manual override)
    // =========================================================================

    #[Test]
    public function it_accepts_a_provided_unique_hostname(): void
    {
        // Use a hostname that is guaranteed not to exist
        $uniqueHostname = 'TSPI-TEST-' . uniqid();

        $hw = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop', 'hostname' => $uniqueHostname]),
            employeeId: 1
        );

        $this->assertSame($uniqueHostname, $hw->hostname);
        $this->assertDatabaseHas('hardware', ['hostname' => $uniqueHostname]);
    }

    #[Test]
    public function it_throws_when_provided_hostname_is_already_active(): void
    {
        // Create an active record with a unique test hostname
        $hostname = 'TSPI-TEST-DUPE-' . uniqid();

        dump("Test hostname: {$hostname}");

        $existing = Hardware::factory()
            ->active()
            ->withHostname($hostname)
            ->create();

        dump("Created existing active record — ID: {$existing->id}, hostname: {$existing->hostname}, status: {$existing->status}");
        dump("Now attempting to create another with same hostname — should throw...");

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("A hardware with hostname '{$hostname}' is already active.");

        dump("Expected exception message: \"A hardware with hostname '{$hostname}' is already active.\"");

        $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop', 'hostname' => $hostname]),
            employeeId: 1
        );
    }
    #[Test]
    public function it_allows_provided_hostname_when_existing_record_is_inactive(): void
    {
        $hostname = 'TSPI-TEST-INACTIVE-' . uniqid();

        Hardware::factory()
            ->inactive()
            ->withHostname($hostname)
            ->create();

        $hw = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop', 'hostname' => $hostname]),
            employeeId: 1
        );

        $this->assertSame($hostname, $hw->hostname);
    }

    #[Test]
    public function it_allows_provided_hostname_when_existing_record_is_defective(): void
    {
        $hostname = 'TSPI-TEST-DEFECTIVE-' . uniqid();

        Hardware::factory()
            ->defective()
            ->withHostname($hostname)
            ->create();

        $hw = $this->service->createHardware(
            array_merge($this->base, ['category' => 'Desktop', 'hostname' => $hostname]),
            employeeId: 1
        );

        $this->assertSame($hostname, $hw->hostname);
    }

    // =========================================================================
    // GROUP 3 — Update hostname validation
    // =========================================================================

    #[Test]
    public function it_allows_update_keeping_the_same_hostname_on_self(): void
    {
        $hostname = 'TSPI-TEST-SELF-' . uniqid();

        $hw = Hardware::factory()
            ->active()
            ->withHostname($hostname)
            ->create();

        // Update same record with same hostname — must not throw
        $updated = $this->service->updateHardware(
            $hw->id,
            ['hostname' => $hostname],
            employeeId: 1
        );

        $this->assertSame($hostname, $updated->hostname);
    }

    #[Test]
    public function it_throws_on_update_when_hostname_is_taken_by_another_active_record(): void
    {
        $hostname1 = 'TSPI-TEST-UPD1-' . uniqid();
        $hostname2 = 'TSPI-TEST-UPD2-' . uniqid();

        $hw1 = Hardware::factory()->active()->withHostname($hostname1)->create();
        $hw2 = Hardware::factory()->active()->withHostname($hostname2)->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("A hardware with hostname '{$hostname1}' is already active.");

        // Try to rename hw2 to hw1's hostname
        $this->service->updateHardware(
            $hw2->id,
            ['hostname' => $hostname1],
            employeeId: 1
        );
    }

    #[Test]
    public function it_allows_update_to_hostname_of_an_inactive_record(): void
    {
        $hostnameInactive = 'TSPI-TEST-INACT-' . uniqid();
        $hostnameActive   = 'TSPI-TEST-ACT-'   . uniqid();

        Hardware::factory()->inactive()->withHostname($hostnameInactive)->create();
        $hw2 = Hardware::factory()->active()->withHostname($hostnameActive)->create();

        // Rename hw2 to the inactive machine's hostname — must be allowed
        $updated = $this->service->updateHardware(
            $hw2->id,
            ['hostname' => $hostnameInactive],
            employeeId: 1
        );

        $this->assertSame($hostnameInactive, $updated->hostname);
    }

    #[Test]
    public function it_allows_update_without_changing_hostname(): void
    {
        $hostname = 'TSPI-TEST-NOBRAND-' . uniqid();

        $hw = Hardware::factory()->active()->withHostname($hostname)->create();

        // No hostname in payload — hostname logic must not trigger
        $updated = $this->service->updateHardware(
            $hw->id,
            ['brand' => 'HP'],
            employeeId: 1
        );

        $this->assertSame($hostname, $updated->hostname);
        $this->assertSame('HP', $updated->brand);
    }

    // =========================================================================
    // GROUP 4 — Repository unit tests (DB layer in isolation)
    // =========================================================================

    #[Test]
    public function repo_active_hostname_exists_returns_true_for_active_record(): void
    {
        $hostname = 'TSPI-TEST-REPO1-' . uniqid();
        Hardware::factory()->withHostname($hostname)->active()->create();

        $this->assertTrue($this->repo->activeHostnameExists($hostname));
    }

    #[Test]
    public function repo_active_hostname_exists_returns_false_when_no_record(): void
    {
        // A hostname that will never exist
        $this->assertFalse($this->repo->activeHostnameExists('TSPI-NONEXISTENT-99999'));
    }

    #[Test]
    public function repo_active_hostname_exists_returns_false_for_inactive_record(): void
    {
        $hostname = 'TSPI-TEST-REPO2-' . uniqid();
        Hardware::factory()->withHostname($hostname)->inactive()->create();

        $this->assertFalse($this->repo->activeHostnameExists($hostname));
    }

    #[Test]
    public function repo_active_hostname_exists_excluding_returns_false_for_same_record(): void
    {
        $hostname = 'TSPI-TEST-REPO3-' . uniqid();
        $hw = Hardware::factory()->withHostname($hostname)->active()->create();

        // Excluding itself — must not flag as duplicate
        $this->assertFalse(
            $this->repo->activeHostnameExistsExcluding($hostname, $hw->id)
        );
    }

    #[Test]
    public function repo_active_hostname_exists_excluding_returns_true_for_different_record(): void
    {
        $hostname1 = 'TSPI-TEST-REPO4A-' . uniqid();
        $hostname2 = 'TSPI-TEST-REPO4B-' . uniqid();

        $hw1 = Hardware::factory()->withHostname($hostname1)->active()->create();
        $hw2 = Hardware::factory()->withHostname($hostname2)->active()->create();

        // hw2 checks if hostname1 is taken by someone else — it is (hw1)
        $this->assertTrue(
            $this->repo->activeHostnameExistsExcluding($hostname1, $hw2->id)
        );
    }

    #[Test]
    public function repo_get_next_hostname_number_increments_from_current_max(): void
    {
        $before = $this->repo->getNextHostnameNumber('TSPI-PC-');

        // Create one desktop — next number should now be before + 1
        Hardware::factory()
            ->withHostname('TSPI-PC-' . str_pad($before, 3, '0', STR_PAD_LEFT))
            ->create();

        $after = $this->repo->getNextHostnameNumber('TSPI-PC-');

        $this->assertSame($before + 1, $after);
    }

    #[Test]
    public function repo_get_next_hostname_number_jumps_past_gaps(): void
    {
        // Use a unique isolated prefix so real data doesn't interfere
        $prefix = 'TSPI-GAPTEST-';

        Hardware::factory()->withHostname($prefix . '001')->create();
        Hardware::factory()->withHostname($prefix . '005')->create();

        // Must jump to 6, not fill in the gap at 2
        $this->assertSame(6, $this->repo->getNextHostnameNumber($prefix));
    }

    #[Test]
    public function repo_get_next_hostname_number_counts_all_statuses_not_just_active(): void
    {
        $prefix = 'TSPI-STATUSTEST-';

        Hardware::factory()->withHostname($prefix . '001')->active()->create();
        Hardware::factory()->withHostname($prefix . '002')->inactive()->create();
        Hardware::factory()->withHostname($prefix . '003')->defective()->create();

        // Even retired/defective numbers must not be reused
        $this->assertSame(4, $this->repo->getNextHostnameNumber($prefix));
    }

    #[Test]
    public function repo_get_next_hostname_number_is_isolated_per_prefix(): void
    {
        $prefix1 = 'TSPI-ISOL1-';
        $prefix2 = 'TSPI-ISOL2-';

        Hardware::factory()->withHostname($prefix1 . '001')->create();
        Hardware::factory()->withHostname($prefix1 . '002')->create();
        Hardware::factory()->withHostname($prefix2 . '001')->create();

        $this->assertSame(3, $this->repo->getNextHostnameNumber($prefix1));
        $this->assertSame(2, $this->repo->getNextHostnameNumber($prefix2));
    }

    // =========================================================================
    // GROUP 5 — Factory smoke tests
    // =========================================================================

    #[Test]
    public function factory_creates_a_hardware_record_in_db(): void
    {
        $hw = Hardware::factory()->create();

        $this->assertDatabaseHas('hardware', ['id' => $hw->id]);
    }

    #[Test]
    public function factory_desktop_state_sets_correct_category_and_prefix(): void
    {
        $hw = Hardware::factory()->desktop()->create();

        $this->assertSame('Desktop', $hw->category);
        $this->assertStringStartsWith('TSPI-PC-', $hw->hostname);
    }

    #[Test]
    public function factory_laptop_state_sets_correct_category_and_prefix(): void
    {
        $hw = Hardware::factory()->laptop()->create();

        $this->assertSame('Laptop', $hw->category);
        $this->assertStringStartsWith('TSPI-LAP-', $hw->hostname);
    }

    #[Test]
    public function factory_promis_terminal_state_sets_correct_category_and_prefix(): void
    {
        $hw = Hardware::factory()->promisTerminal()->create();

        $this->assertSame('Promis Terminal', $hw->category);
        $this->assertStringStartsWith('TELFORD-W', $hw->hostname);
    }

    #[Test]
    public function factory_with_hostname_overrides_hostname(): void
    {
        $hostname = 'CUSTOM-TEST-' . uniqid();
        $hw = Hardware::factory()->withHostname($hostname)->create();

        $this->assertSame($hostname, $hw->hostname);
    }

    #[Test]
    public function factory_inactive_state_sets_inactive_status(): void
    {
        $hw = Hardware::factory()->inactive()->create();

        $this->assertSame(Status::INACTIVE, $hw->status);
    }

    #[Test]
    public function factory_make_does_not_persist_to_database(): void
    {
        $hw = Hardware::factory()->desktop()->make();

        $this->assertNull($hw->id);
        $this->assertDatabaseMissing('hardware', ['hostname' => $hw->hostname]);
    }

    #[Test]
    public function factory_count_creates_multiple_records(): void
    {
        $prefix = 'TSPI-COUNTTEST-';
        Hardware::factory()
            ->count(5)
            ->sequence(fn($s) => ['hostname' => $prefix . str_pad($s->index + 1, 3, '0', STR_PAD_LEFT)])
            ->create();

        $this->assertDatabaseCount('hardware', Hardware::count());
        $this->assertSame(5, Hardware::where('hostname', 'like', $prefix . '%')->count());
    }
}
