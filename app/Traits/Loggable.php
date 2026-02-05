<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

trait Loggable
{
    public static function bootLoggable()
    {
        static::created(function ($model) {
            $model->writeLog('created');
        });

        static::updated(function ($model) {
            $model->writeLog('updated');
        });

        static::deleted(function ($model) {
            $model->writeLog('deleted');
        });

        if (in_array(SoftDeletes::class, class_uses_recursive(static::class))) {
            static::restored(function ($model) {
                $model->writeLog('restored');
            });
        }
    }

    protected function writeLog(string $action): void
    {
        $empData = session('emp_data');

        /**
         * Ignore "noise" fields
         * - updated_at → automatic timestamp
         * - updated_by → editor tracking only
         */
        $ignoredFields = ['updated_at', 'updated_by'];

        $dirty = collect($this->getDirty())
            ->except($ignoredFields)
            ->toArray();

        // For updates: if nothing meaningful changed, do not log
        if ($action === 'updated' && empty($dirty)) {
            return;
        }

        $actionType = $this->currentAction ?? strtoupper($action);

        // Format Carbon dates consistently
        $formatDateFields = function (array $values) {
            return collect($values)->map(function ($value) {
                return $value instanceof Carbon
                    ? $value->format('Y-m-d H:i:s')
                    : $value;
            })->toArray();
        };

        ActivityLog::create([
            'loggable_type' => get_class($this),
            'loggable_id'   => $this->jorf_id ?? $this->id,
            'action_type'   => $actionType,
            'action_by'     => $empData['emp_id']
                ?? $empData['EMPLOYID']
                ?? null,
            'action_at'     => now()->format('Y-m-d H:i:s'),

            // UPDATED: store old + new values only for meaningful fields
            'old_values' => $action === 'updated'
                ? $formatDateFields(
                    array_intersect_key($this->getOriginal(), $dirty)
                )
                : null,

            'new_values' => $action === 'updated'
                ? $formatDateFields($dirty)
                : $formatDateFields($this->getAttributes()),
        ]);
    }

    public function activityLogs()
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }
}
