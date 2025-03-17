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

provider "aws" {
  region = var.aws_region
}

# Lambda Function
module "lambda" {
  source = "../modules/lambda"

  environment         = var.environment
  project_name        = var.project_name
  image_tag          = var.image_tag
  ecr_repository_url = var.ecr_repository_url
  ecr_repository_arn = var.ecr_repository_arn
  lambda_memory_size = var.lambda_memory_size
  lambda_timeout     = var.lambda_timeout
  allowed_origins    = var.allowed_origins
  openai_api_key     = var.openai_api_key
}

# Output definitions
output "function_url" {
  description = "Lambda Function URL"
  value       = module.lambda.function_url
}

output "function_arn" {
  description = "Lambda Function ARN"
  value       = module.lambda.function_arn
}