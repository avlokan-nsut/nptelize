from fastapi import UploadFile


async def save_file_to_local_storage(file: UploadFile, file_path: str) -> None:
    chunk_size = 1024 * 1024  # 1MB chunks
    with open(file_path, 'wb') as f:
        while chunk := await file.read(chunk_size):
            f.write(chunk)