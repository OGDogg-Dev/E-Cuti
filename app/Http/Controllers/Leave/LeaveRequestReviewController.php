<?php

namespace App\Http\Controllers\Leave;

use App\Domain\Leave\DataTransferObjects\LeaveRequestData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Leave\StoreLeaveRequestRequest;
use App\Http\Resources\Leave\LeaveRequestPreviewResource;
use App\Models\LeaveRequest;
use App\Services\Leave\LeavePolicyResolver;
use App\Services\Leave\LeaveRequestDocumentService;
use App\Services\Leave\LeaveRequestPreviewBuilder;
use Illuminate\Support\Facades\Auth;

class LeaveRequestReviewController extends Controller
{
    public function __construct(
        private readonly LeavePolicyResolver $policyResolver,
        private readonly LeaveRequestPreviewBuilder $previewBuilder,
        private readonly LeaveRequestDocumentService $documentService,
    ) {
    }

    public function preview(StoreLeaveRequestRequest $request)
    {
        $this->authorize('create', LeaveRequest::class);

        /** @var \App\Models\User $user */
        $user = Auth::user()->loadMissing(['division', 'roles']);

        $data = LeaveRequestData::fromRequest($request, $user);
        $this->policyResolver->resolve($data->user, $data->policyId, $data->leaveTypeId);

        $preview = $this->previewBuilder->build($data);

        return (new LeaveRequestPreviewResource($preview))
            ->response()
            ->setStatusCode(200);
    }

    public function document(StoreLeaveRequestRequest $request)
    {
        $this->authorize('create', LeaveRequest::class);

        /** @var \App\Models\User $user */
        $user = Auth::user()->loadMissing(['division', 'roles']);

        $data = LeaveRequestData::fromRequest($request, $user);
        $this->policyResolver->resolve($data->user, $data->policyId, $data->leaveTypeId);

        $preview = $this->previewBuilder->build($data);
        $documentBinary = $this->documentService->generateDocx($preview);
        $fileName = 'preview-'.$this->documentService->fileName($preview, 'docx');

        return response()->streamDownload(
            static function () use ($documentBinary): void {
                echo $documentBinary;
            },
            $fileName,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]
        );
    }
}
