<?php

namespace Database\Factories;

use App\Constants\Status;
use App\Models\Hardware;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Hardware>
 *
 * Usage examples:
 *   Hardware::factory()->create()
 *   Hardware::factory()->desktop()->active()->create()
 *   Hardware::factory()->laptop()->inactive()->withHostname('TSPI-LAP-005')->create()
 *   Hardware::factory()->promisTerminal()->count(3)->create()
 *   Hardware::factory()->make()   // no DB write
 */
class HardwareFactory extends Factory
{
    protected $model = Hardware::class;

    // Mirrors the prefix map in HardwareUpdateService
    private const PREFIX_MAP = [
        'Desktop'         => 'TSPI-PC-',
        'Laptop'          => 'TSPI-LAP-',
        'Promis Terminal' => 'TELFORD-W',
    ];

    // ─── Base definition ─────────────────────────────────────────────────────

    public function definition(): array
    {
        $category = $this->faker->randomElement(array_keys(self::PREFIX_MAP));
        $prefix   = self::PREFIX_MAP[$category];
        $number   = str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT);

        return [
            'hostname'      => $prefix . $number,
            'category'      => $category,
            'brand'         => $this->faker->randomElement([
                'Dell',
                'HP',
                'Lenovo',
                'Asus',
                'Acer',
                'Apple',
                'Samsung',
            ]),
            'model'         => $this->faker->bothify('Model-###??'),
            'serial_number' => strtoupper($this->faker->unique()->bothify('SN-########')),
            'ip_address'    => $this->faker->localIpv4(),
            'wifi_mac'      => $this->faker->macAddress(),
            'lan_mac'       => $this->faker->macAddress(),
            'location'      => $this->faker->randomElement([
                'Main Office',
                'Warehouse',
                'IT Room',
                'Production Floor',
                'Reception',
            ]),
            'department'    => $this->faker->randomElement([
                'IT',
                'HR',
                'Finance',
                'Operations',
                'Accounting',
                'Admin',
            ]),
            'prodline'      => $this->faker->randomElement(['Line A', 'Line B', 'Line C', null]),
            'station'       => $this->faker->randomElement(['Station 1', 'Station 2', null]),
            'installed_by'  => null,
            'date_issued'   => $this->faker->dateTimeBetween('-2 years', 'now'),
            'remarks'       => $this->faker->optional()->sentence(),
            'status'        => Status::ACTIVE,
            'created_by'    => 1,
            'updated_by'    => 1,
        ];
    }

    // ─── Status states ───────────────────────────────────────────────────────

    public function active(): static
    {
        return $this->state(['status' => Status::ACTIVE]);
    }

    public function inactive(): static
    {
        return $this->state(['status' => Status::INACTIVE]);
    }

    public function defective(): static
    {
        return $this->state(['status' => Status::DEFECTIVE]);
    }

    public function brandNew(): static
    {
        return $this->state(['status' => Status::NEW]);
    }

    // ─── Category states ─────────────────────────────────────────────────────

    public function desktop(): static
    {
        return $this->state(function () {
            $number = str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT);
            return [
                'category' => 'Desktop',
                'hostname' => 'TSPI-PC-' . $number,
            ];
        });
    }

    public function laptop(): static
    {
        return $this->state(function () {
            $number = str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT);
            return [
                'category' => 'Laptop',
                'hostname' => 'TSPI-LAP-' . $number,
            ];
        });
    }

    public function promisTerminal(): static
    {
        return $this->state(function () {
            $number = str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT);
            return [
                'category' => 'Promis Terminal',
                'hostname' => 'TELFORD-W' . $number,
            ];
        });
    }

    // ─── Field states ────────────────────────────────────────────────────────

    /**
     * Force a specific hostname.
     * Use this when you need an exact hostname in a test.
     *
     * Hardware::factory()->withHostname('TSPI-PC-001')->create()
     */
    public function withHostname(string $hostname): static
    {
        return $this->state(['hostname' => $hostname]);
    }

    /**
     * Force a specific category without changing hostname.
     *
     * Hardware::factory()->withCategory('Server')->create()
     */
    public function withCategory(string $category): static
    {
        return $this->state(['category' => $category]);
    }

    /**
     * Set a specific employee as creator.
     *
     * Hardware::factory()->createdBy(42)->create()
     */
    public function createdBy(int $employeeId): static
    {
        return $this->state([
            'created_by' => $employeeId,
            'updated_by' => $employeeId,
        ]);
    }
}
