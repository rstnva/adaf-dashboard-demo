# ALB Module Outputs

output "alb_id" {
  description = "ID of the Application Load Balancer"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ARN suffix of the Application Load Balancer"
  value       = aws_lb.main.arn_suffix
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_hosted_zone_id" {
  description = "Canonical hosted zone ID of the Application Load Balancer (alias for alb_zone_id)"
  value       = aws_lb.main.zone_id
}

# Target Groups
output "blue_target_group_id" {
  description = "ID of the blue target group"
  value       = aws_lb_target_group.blue.id
}

output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "blue_target_group_arn_suffix" {
  description = "ARN suffix of the blue target group"
  value       = aws_lb_target_group.blue.arn_suffix
}

output "green_target_group_id" {
  description = "ID of the green target group"
  value       = aws_lb_target_group.green.id
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

output "green_target_group_arn_suffix" {
  description = "ARN suffix of the green target group"
  value       = aws_lb_target_group.green.arn_suffix
}

# Active Target Group (for blue/green deployments)
output "active_target_group_arn" {
  description = "ARN of the currently active target group"
  value       = var.active_target_group == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
}

output "inactive_target_group_arn" {
  description = "ARN of the currently inactive target group"
  value       = var.active_target_group == "blue" ? aws_lb_target_group.green.arn : aws_lb_target_group.blue.arn
}

# Listeners
output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = var.enable_https_redirect ? null : (length(aws_lb_listener.http) > 0 ? aws_lb_listener.http[0].arn : null)
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener"
  value       = var.certificate_arn != null ? aws_lb_listener.https[0].arn : null
}

output "http_redirect_listener_arn" {
  description = "ARN of the HTTP redirect listener"
  value       = var.enable_https_redirect && length(aws_lb_listener.http_redirect) > 0 ? aws_lb_listener.http_redirect[0].arn : null
}

# Blue/Green Deployment Information
output "blue_green_info" {
  description = "Information about blue/green deployment configuration"
  value = {
    active_environment    = var.active_target_group
    blue_target_group    = aws_lb_target_group.blue.arn
    green_target_group   = aws_lb_target_group.green.arn
    header_routing       = var.enable_header_routing
    canary_routing       = var.enable_canary_routing
    blue_weight         = var.canary_blue_weight
    green_weight        = var.canary_green_weight
  }
}

# Endpoints
output "alb_endpoint" {
  description = "Full ALB endpoint URL"
  value = var.certificate_arn != null ? (
    "https://${aws_lb.main.dns_name}"
  ) : (
    "http://${aws_lb.main.dns_name}"
  )
}

output "health_check_path" {
  description = "Health check path for target groups"
  value       = var.health_check_path
}

# Security and Network Information
output "security_groups" {
  description = "Security groups associated with the ALB"
  value       = var.security_group_ids
}

output "subnets" {
  description = "Subnets associated with the ALB"
  value       = var.subnet_ids
}

output "vpc_id" {
  description = "VPC ID of the ALB"
  value       = var.vpc_id
}

# Monitoring
output "cloudwatch_alarms_created" {
  description = "Whether CloudWatch alarms were created"
  value       = var.create_cloudwatch_alarms
}

# Configuration Summary
output "alb_configuration" {
  description = "ALB configuration summary"
  value = {
    name                    = aws_lb.main.name
    internal               = var.internal
    deletion_protection    = var.enable_deletion_protection
    cross_zone_lb         = var.enable_cross_zone_load_balancing
    http2_enabled         = var.enable_http2
    idle_timeout          = var.idle_timeout
    ip_address_type       = var.ip_address_type
    ssl_policy            = var.ssl_policy
    https_redirect        = var.enable_https_redirect
    access_logs_enabled   = var.enable_access_logs
    stickiness_enabled    = var.enable_stickiness
  }
}