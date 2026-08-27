# AWS CLI Command Reference Guide

A complete, easy-to-understand reference guide for managing AWS EC2 instances, S3 storage, and credentials directly from your local terminal/PowerShell.

---

## Table of Contents
1. [Prerequisites & Identity Check](#1-prerequisites--identity-check)
2. [EC2 Instance Management (Servers)](#2-ec2-instance-management-servers)
3. [S3 Storage & Media Management (Images/Files)](#3-s3-storage--media-management-imagesfiles)
4. [AWS Regions Reference](#4-aws-regions-reference)
5. [Common Troubleshooting & Tips](#5-common-troubleshooting--tips)

---

## 1. Prerequisites & Identity Check

### Check Current Authenticated AWS User
- **Why**: Verifies which AWS account and IAM user your local CLI is currently logged in as.
- **Where**: Run in PowerShell/Terminal before executing any AWS commands.

```powershell
aws sts get-caller-identity
```

---

## 2. EC2 Instance Management (Servers)

### A. List All EC2 Instances & Public IPs
- **Why**: Displays all your virtual servers, their Instance IDs, running states (`running`/`stopped`), and Public IP addresses.
- **Where**: Use when you need to find an instance ID or check if a server is running.

```powershell
# For Mumbai Region (ap-south-1)
aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" --output table --region ap-south-1

# For Hyderabad Region (ap-south-2)
aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" --output table --region ap-south-2
```

---

### B. Stop an EC2 Instance (Shutdown Server)
- **Why**: Stops a running server to save AWS hosting costs when not in use.
- **Where**: Run from local PowerShell whenever you want to shut down your website server.

```powershell
# Stop instance in Mumbai
aws ec2 stop-instances --instance-ids i-0f94696273e4b2355 --region ap-south-1

# Stop instance in Hyderabad
aws ec2 stop-instances --instance-ids i-0276107a7e889f750 --region ap-south-2
```

---

### C. Start an EC2 Instance (Boot Up Server)
- **Why**: Starts a stopped server so your website and services come back online.
- **Where**: Run when you want to start up your server again.

```powershell
# Start instance in Mumbai
aws ec2 start-instances --instance-ids i-0f94696273e4b2355 --region ap-south-1

# Start instance in Hyderabad
aws ec2 start-instances --instance-ids i-0276107a7e889f750 --region ap-south-2
```

---

### D. Reboot an EC2 Instance (Restart Server)
- **Why**: Soft-reboots your server without changing its public IP address (useful after software updates).

```powershell
aws ec2 reboot-instances --instance-ids i-0f94696273e4b2355 --region ap-south-1
```

---

## 3. S3 Storage & Media Management (Images/Files)

### A. List All S3 Buckets
- **Why**: Shows all S3 buckets in your AWS account.

```powershell
aws s3 ls
```

---

### B. List Files Inside an S3 Bucket
- **Why**: Lists all uploaded images, product media, and files inside a specific S3 bucket.

```powershell
aws s3 ls s3://vasanthi-signature-images --region ap-south-2
```

---

### C. Upload / Sync Local Files to S3 Bucket
- **Why**: Uploads all images from a local folder to your AWS S3 bucket.
- **Where**: Useful for batch uploading product images or backing up media.

```powershell
# Upload/sync local storage folder to S3 bucket
aws s3 sync ./backend/storage s3://vasanthi-signature-images --region ap-south-2
```

---

### D. Copy a Single File to S3 Bucket
- **Why**: Uploads one specific file to S3.

```powershell
aws s3 cp ./sample.jpg s3://vasanthi-signature-images/products/sample.jpg --region ap-south-2
```

---

### E. Delete a File from S3 Bucket
- **Why**: Removes a specific image or file from S3.

```powershell
aws s3 rm s3://vasanthi-signature-images/products/sample.jpg --region ap-south-2
```

---

## 4. AWS Regions Reference

| Region Name | AWS Region Code |
|---|---|
| **Asia Pacific (Mumbai)** | `ap-south-1` |
| **Asia Pacific (Hyderabad)** | `ap-south-2` |

---

## 5. Common Troubleshooting & Tips

1. **IP Address Change After Restart**:
   - When an EC2 instance is stopped and started again, AWS assigns a new public IP unless you attach an **Elastic IP**.
2. **AccessDenied Error**:
   - Make sure your IAM user has `AmazonS3FullAccess` or `AmazonEC2FullAccess` attached in the AWS IAM Console.
