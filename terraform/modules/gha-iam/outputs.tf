output "github_actions_role_arn" {
  description = "GitHub Actions IAM Role ARN"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_name" {
  description = "GitHub Actions IAM Role Name"
  value       = aws_iam_role.github_actions.name
}

output "oidc_provider_arn" {
  description = "GitHub Actions OIDC Provider ARN"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}
