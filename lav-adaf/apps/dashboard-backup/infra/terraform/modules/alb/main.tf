# Application Load Balancer Module - Blue/Green deployment support

# ALB
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = var.internal
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets           = var.subnet_ids

  enable_deletion_protection       = var.enable_deletion_protection
  enable_cross_zone_load_balancing = var.enable_cross_zone_load_balancing
  enable_http2                    = var.enable_http2
  idle_timeout                    = var.idle_timeout
  ip_address_type                 = var.ip_address_type

  # Access logs
  dynamic "access_logs" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.access_logs_prefix
      enabled = true
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-alb"
  })
}

# Target Groups for Blue/Green deployments
resource "aws_lb_target_group" "blue" {
  name     = "${var.project_name}-blue-tg"
  port     = var.target_port
  protocol = var.target_protocol
  vpc_id   = var.vpc_id
  
  target_type = var.target_type

  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    interval            = var.health_check_interval
    matcher             = var.health_check_matcher
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = var.health_check_protocol
    timeout             = var.health_check_timeout
    unhealthy_threshold = var.health_check_unhealthy_threshold
  }

  # Deregistration delay for graceful shutdown
  deregistration_delay = var.deregistration_delay

  # Stickiness configuration
  dynamic "stickiness" {
    for_each = var.enable_stickiness ? [1] : []
    content {
      type            = "lb_cookie"
      cookie_duration = var.stickiness_duration
      enabled         = true
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-blue-tg"
    Environment = "blue"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "green" {
  name     = "${var.project_name}-green-tg"
  port     = var.target_port
  protocol = var.target_protocol
  vpc_id   = var.vpc_id
  
  target_type = var.target_type

  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    interval            = var.health_check_interval
    matcher             = var.health_check_matcher
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = var.health_check_protocol
    timeout             = var.health_check_timeout
    unhealthy_threshold = var.health_check_unhealthy_threshold
  }

  deregistration_delay = var.deregistration_delay

  dynamic "stickiness" {
    for_each = var.enable_stickiness ? [1] : []
    content {
      type            = "lb_cookie"
      cookie_duration = var.stickiness_duration
      enabled         = true
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-green-tg"
    Environment = "green"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http_redirect" {
  count = var.enable_https_redirect ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = var.common_tags
}

# HTTP Listener (for HTTP-only deployments)
resource "aws_lb_listener" "http" {
  count = var.enable_https_redirect ? 0 : 1

  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = var.active_target_group == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
  }

  tags = var.common_tags

  lifecycle {
    ignore_changes = [default_action]
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  count = var.certificate_arn != null ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = var.active_target_group == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
  }

  tags = var.common_tags

  lifecycle {
    ignore_changes = [default_action]
  }
}

# Additional certificates for multi-domain support
resource "aws_lb_listener_certificate" "additional" {
  count = length(var.additional_certificate_arns)

  listener_arn    = aws_lb_listener.https[0].arn
  certificate_arn = var.additional_certificate_arns[count.index]
}

# Custom listener rules for blue/green deployments
resource "aws_lb_listener_rule" "blue_header" {
  count = var.enable_header_routing ? 1 : 0

  listener_arn = var.certificate_arn != null ? aws_lb_listener.https[0].arn : aws_lb_listener.http[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  condition {
    http_header {
      http_header_name = var.blue_green_header_name
      values          = ["blue"]
    }
  }

  tags = var.common_tags
}

resource "aws_lb_listener_rule" "green_header" {
  count = var.enable_header_routing ? 1 : 0

  listener_arn = var.certificate_arn != null ? aws_lb_listener.https[0].arn : aws_lb_listener.http[0].arn
  priority     = 101

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.green.arn
  }

  condition {
    http_header {
      http_header_name = var.blue_green_header_name
      values          = ["green"]
    }
  }

  tags = var.common_tags
}

# Weighted routing for canary deployments
resource "aws_lb_listener_rule" "canary" {
  count = var.enable_canary_routing ? 1 : 0

  listener_arn = var.certificate_arn != null ? aws_lb_listener.https[0].arn : aws_lb_listener.http[0].arn
  priority     = 50

  action {
    type = "forward"
    
    forward {
      target_group {
        arn    = aws_lb_target_group.blue.arn
        weight = var.canary_blue_weight
      }
      
      target_group {
        arn    = aws_lb_target_group.green.arn
        weight = var.canary_green_weight
      }

      stickiness {
        enabled  = var.enable_stickiness
        duration = var.stickiness_duration
      }
    }
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  tags = var.common_tags
}

# CloudWatch alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.response_time_threshold
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_healthy_host_count" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-alb-healthy-host-count"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.healthy_host_threshold
  alarm_description   = "This metric monitors ALB healthy host count"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TargetGroup  = aws_lb_target_group.blue.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_http_5xx_count" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-alb-http-5xx-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.http_5xx_threshold
  alarm_description   = "This metric monitors ALB 5XX errors"
  alarm_actions       = var.alarm_actions

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.common_tags
}