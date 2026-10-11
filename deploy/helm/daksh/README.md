# Daksh Game BaaS — Production Helm Chart

Official Helm v3 Chart for deploying Daksh Game BaaS (Nakama Core Engine + Next.js Studio + PostgreSQL + Redis) to any Kubernetes cluster (AWS EKS, Google GKE, Azure AKS, Bare Metal).

## Quickstart

```bash
# 1. Add your custom values override (optional)
helm install my-daksh ./deploy/helm/daksh -f my-values.yaml

# 2. Check running pods
kubectl get pods -l app.kubernetes.io/name=daksh

# 3. Upgrade with any custom changes
helm upgrade my-daksh ./deploy/helm/daksh --set nakama.replicaCount=5
```

## Why Helm Only? Any Change Required is Possible:
With `values.yaml`, you can customize:
- **Replica count & Autoscaling**: `nakama.replicaCount`, `nakama.autoscaling.maxReplicas`
- **CPU & Memory limits**: `nakama.resources`, `studio.resources`
- **External Managed Database**: Set `postgresql.host="your-aws-rds-postgres.internal"`
- **Domain & Ingress Routing**: Set `ingress.hosts` and TLS certificates
- **Socket timeouts & packet limits**: `nakama.config.socket.maxMessageSizeBytes`
- **Billing & API Keys**: `studio.env.RAZORPAY_KEY_ID`, `studio.env.PADDLE_API_KEY`
