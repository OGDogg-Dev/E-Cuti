<?php

namespace App\Http\Controllers\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Services\Leave\LeaveRequestDocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LeaveRequestDocumentController extends Controller
{
    public function __construct(private readonly LeaveRequestDocumentService $documentService)
    {
    }

    public function show(Request $request, LeaveRequest $leaveRequest)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user()->loadMissing('roles');

        if (! $user->hasAnyRole(['admin', 'sdm', 'kepala_kantor'])) {
            abort(403, 'Anda tidak memiliki akses untuk mengunduh formulir ini.');
        }

        $pdf = $this->documentService->generatePdf($leaveRequest);
        $fileName = $this->documentService->fileName($leaveRequest);

        return $pdf->download($fileName);
    }
}
