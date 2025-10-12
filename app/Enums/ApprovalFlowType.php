<?php

namespace App\Enums;

enum ApprovalFlowType: string
{
    case SERIAL = 'SERIAL';
    case PARALLEL_AND = 'PARALLEL_AND';
}
