terraform {
  required_version = "1.10.4"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.90.0"
    }
  }
}

provider "aws" {}

# S3 bucket and DynamoDB table for Terraform state
module "state_storage" {
  source = "../../modules/s3"

  project_name = var.project_name
}

module "state_lock" {
  source = "../../modules/dynamodb"

  project_name = var.project_name
}

# GitHub Actions OIDC provider and IAM role (shared across environments)
module "gha_iam" {
  source = "../../modules/gha-iam"

  project_name      = var.project_name
  github_repository = var.github_repository
}

# Output definitions
output "github_actions_role_arn" {
  description = "GitHub Actions IAM Role ARN"
  value       = module.gha_iam.github_actions_role_arn
}

output "state_bucket_name" {
  description = "S3 bucket name for Terraform state"
  value       = module.state_storage.bucket_name
}

output "state_lock_table_name" {
  description = "DynamoDB table name for Terraform state lock"
  value       = module.state_lock.table_name
}