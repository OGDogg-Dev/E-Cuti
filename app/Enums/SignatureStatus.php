<?php

namespace App\Enums;

enum SignatureStatus: string
{
    case PENDING = 'PENDING';
    case SIGNED = 'SIGNED';
    case FAILED = 'FAILED';
}
