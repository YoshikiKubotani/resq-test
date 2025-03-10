# ECR and GitHub Actions OIDC Module
module "ecr" {
  source = "./modules/ecr"

  environment       = var.environment
  project_name      = var.project_name
  github_repository = var.github_repository
}

# Lambda Function Module
module "lambda" {
  source = "./modules/lambda"

  environment         = var.environment
  project_name        = var.project_name
  image_tag          = var.image_tag
  ecr_repository_url = module.ecr.repository_url
  lambda_memory_size = var.lambda_memory_size
  lambda_timeout     = var.lambda_timeout
  allowed_origins    = var.allowed_origins
}

# Output definitions
output "function_url" {
  description = "Lambda Function URL"
  value       = module.lambda.function_url
}

output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = module.ecr.repository_url
}

output "github_actions_role_arn" {
  description = "GitHub Actions IAM Role ARN"
  value       = module.ecr.github_actions_role_arn
}