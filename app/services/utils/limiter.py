from fastapi import UploadFile, HTTPException
import magic  # python-magic library for file type detection

MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

async def process_upload(file: UploadFile) -> UploadFile:
    # 1. Check file extension first
    filename = file.filename
    if not filename or not filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed. Please upload a file with .pdf extension."
        )
    
    # 2. Read the first chunk to check the actual file content
    first_chunk = await file.read(8192)  # Read first 8KB for content type detection
    
    # 3. Use python-magic to check file signature/magic bytes
    mime_type = magic.from_buffer(first_chunk, mime=True)
    if mime_type != 'application/pdf':
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file content. The file doesn't appear to be a PDF (detected: {mime_type})."
        )
    
    # 4. Reset file position for complete processing
    await file.seek(0)
    
    # 5. Process the entire file from the beginning
    file_size = 0  # Start fresh with the size count
    chunk_size = 1024 * 1024  # 1MB chunks
    
    # Process all chunks from the beginning
    while chunk := await file.read(chunk_size):
        file_size += len(chunk)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024:.2f} MB."
            )
    
    await file.seek(0)  # Reset file position for further processing if needed
    return file
