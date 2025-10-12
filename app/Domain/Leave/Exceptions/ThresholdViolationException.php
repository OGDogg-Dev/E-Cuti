<?php

namespace App\Domain\Leave\Exceptions;

use RuntimeException;

class ThresholdViolationException extends RuntimeException
{
    public function __construct(
        private readonly ?array $suggestedDates = null,
        string $message = 'Pengajuan melewati ambang minimum layanan.'
    ) {
        parent::__construct($message);
    }

    public static function withSuggestion(?array $suggestedDates): self
    {
        return new self($suggestedDates);
    }

    public function suggestedDates(): ?array
    {
        return $this->suggestedDates;
    }
}

