terraform {
  required_version = "1.10.4"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.90.0"
    }
  }
}

# Auth Module (OIDC Provider and IAM Role)
module "auth" {
  source = "../modules/auth"

  environment       = var.environment
  project_name      = var.project_name
  github_repository = var.github_repository
}

# ECR Repository
module "ecr" {
  source = "../modules/ecr"

  environment              = var.environment
  project_name             = var.project_name
  github_actions_role_name = module.auth.github_actions_role_name
}

# Output definitions
output "github_actions_role_arn" {
  description = "GitHub Actions IAM Role ARN"
  value       = module.auth.github_actions_role_arn
}

output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = module.ecr.repository_url
}