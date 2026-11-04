package storage

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/blob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/bloberror"
)

var client *azblob.Client
var containerName string

func Init(ctx context.Context) error {
	connStr, ok := os.LookupEnv("AZURE_STORAGE_CONNECTION_STRING")
	if !ok || connStr == "" {
		return fmt.Errorf("AZURE_STORAGE_CONNECTION_STRING not set")
	}
	containerName, ok = os.LookupEnv("AZURE_STORAGE_CONTAINER_NAME")
	if !ok || containerName == "" {
		return fmt.Errorf("AZURE_STORAGE_CONTAINER_NAME not set")
	}
	var err error
	client, err = azblob.NewClientFromConnectionString(connStr, nil)
	if err != nil {
		return fmt.Errorf("failed to create storage client: %w", err)
	}
	if _, err := client.CreateContainer(ctx, containerName, nil); err != nil && !bloberror.HasCode(err, bloberror.ContainerAlreadyExists) {
		return fmt.Errorf("failed to create container: %w", err)
	}
	return nil
}

func Upload(ctx context.Context, blobName string, reader io.Reader, contentType string) error {
	if _, err := client.UploadStream(ctx, containerName, blobName, reader, &azblob.UploadStreamOptions{
		HTTPHeaders: &blob.HTTPHeaders{BlobContentType: &contentType},
	}); err != nil {
		return fmt.Errorf("failed to upload blob: %w", err)
	}
	return nil
}

func Download(ctx context.Context, blobName string, offset, count int64) (io.ReadCloser, error) {
	resp, err := client.DownloadStream(ctx, containerName, blobName, &azblob.DownloadStreamOptions{
		Range: blob.HTTPRange{Offset: offset, Count: count},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to download blob: %w", err)
	}
	return resp.Body, nil
}

func Delete(ctx context.Context, blobName string) error {
	if _, err := client.DeleteBlob(ctx, containerName, blobName, &azblob.DeleteBlobOptions{DeleteSnapshots: to.Ptr(blob.DeleteSnapshotsOptionTypeInclude)}); err != nil && !bloberror.HasCode(err, bloberror.BlobNotFound) {
		return fmt.Errorf("failed to delete blob: %w", err)
	}
	return nil
}

func IsMissing(err error) bool {
	return bloberror.HasCode(err, bloberror.BlobNotFound)
}
