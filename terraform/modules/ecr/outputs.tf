output "repository_url" {
  description = "ECR Repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "repository_arn" {
  description = "ECR Repository ARN"
  value       = aws_ecr_repository.app.arn
}

output "github_actions_role_arn" {
  description = "GitHub Actions IAM Role ARN"
  value       = aws_iam_role.github_actions.arn
}