<?php

namespace App\Validators;

use App\Response;

/** Collects field errors; call failIfErrors() to end the request with a 422 listing them. */
class Validator
{
    /** @var array<string, string> */
    private array $errors = [];

    public function add(string $field, string $message): void
    {
        $this->errors[$field] ??= $message;
    }

    public function hasErrors(): bool
    {
        return $this->errors !== [];
    }

    public function failIfErrors(): void
    {
        if ($this->hasErrors()) {
            Response::error('Please fix the highlighted fields.', 422, $this->errors);
        }
    }

    public function string(mixed $value, string $field, int $max, bool $required = false, int $min = 0): ?string
    {
        if ($value === null || (is_string($value) && trim($value) === '')) {
            if ($required) {
                $this->add($field, 'This field is required.');
            }
            return null;
        }
        if (!is_string($value) && !is_numeric($value)) {
            $this->add($field, 'Must be text.');
            return null;
        }

        $value = trim((string) $value);
        $length = mb_strlen($value);
        if ($length < $min) {
            $this->add($field, "Must be at least {$min} characters.");
        } elseif ($length > $max) {
            $this->add($field, "Must be {$max} characters or fewer.");
        }

        return $value;
    }

    public function id(mixed $value, string $field, bool $required = true): ?int
    {
        $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id === false) {
            if ($required || ($value !== null && $value !== '')) {
                $this->add($field, 'Please choose a valid option.');
            }
            return null;
        }
        return $id;
    }

    public function date(mixed $value, string $field, bool $notFuture = true): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', (string) $value);
        if ($date === false || $date->format('Y-m-d') !== $value) {
            $this->add($field, 'Use a valid date (YYYY-MM-DD).');
            return null;
        }
        if ($notFuture && $date > new \DateTimeImmutable('today')) {
            $this->add($field, 'Date cannot be in the future.');
        }
        return $value;
    }

    public function url(mixed $value, string $field): ?string
    {
        $url = $this->string($value, $field, 255, true);
        if ($url !== null && (!filter_var($url, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $url))) {
            $this->add($field, 'Use a full link starting with http:// or https://.');
        }
        return $url;
    }

    public function optionalUrl(mixed $value, string $field): ?string
    {
        if ($value === null || (is_string($value) && trim($value) === '')) {
            return null;
        }
        return $this->url($value, $field);
    }

    public function email(mixed $value, string $field): ?string
    {
        $email = $this->string($value, $field, 150);
        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->add($field, 'Use a valid email address.');
        }
        return $email;
    }

    public function bool(mixed $value): int
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    }

    public function int(mixed $value, string $field, int $min, int $max, int $default): int
    {
        if ($value === null || $value === '') {
            return $default;
        }
        $int = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => $min, 'max_range' => $max]]);
        if ($int === false) {
            $this->add($field, "Use a whole number from {$min} to {$max}.");
            return $default;
        }
        return $int;
    }

    public function coordinate(mixed $value, string $field, float $limit): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_numeric($value) || abs((float) $value) > $limit) {
            $this->add($field, "Use a number between -{$limit} and {$limit}.");
            return null;
        }
        return number_format((float) $value, 7, '.', '');
    }

    /** @return array<int, mixed> */
    public function list(mixed $value, string $field, int $max): array
    {
        if ($value === null) {
            return [];
        }
        if (!is_array($value) || !array_is_list($value)) {
            $this->add($field, 'Must be a list.');
            return [];
        }
        if (count($value) > $max) {
            $this->add($field, "Add {$max} items or fewer.");
        }
        return $value;
    }
}
