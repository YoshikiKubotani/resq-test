terraform {
  required_version = "1.10.4"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.90.0"
    }
  }

  backend "s3" {}
}

provider "aws" {}

# ECR Repository (environment specific)
module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  environment  = "prod"
}

# Output definitions
output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = module.ecr.repository_url
}

output "ecr_repository_arn" {
  description = "ECR Repository ARN"
  value       = module.ecr.repository_arn
}