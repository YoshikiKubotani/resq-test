terraform {
  required_version = "1.10.4"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.90.0"
    }
  }
}

# Lambda Function
module "lambda" {
  source = "../modules/lambda"

  environment        = var.environment
  project_name       = var.project_name
  image_tag          = var.image_tag
  ecr_repository_url = var.ecr_repository_url
  lambda_memory_size = var.lambda_memory_size
  lambda_timeout     = var.lambda_timeout
  allowed_origins    = var.allowed_origins
}

# Output definitions
output "function_url" {
  description = "Lambda Function URL"
  value       = module.lambda.function_url
}