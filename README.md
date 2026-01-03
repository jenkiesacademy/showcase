# Engineering Showcase Portfolio

A curated collection of projects demonstrating 15 years of software engineering experience across full-stack development, architecture design, DevOps, and modern engineering practices.

## 🎯 Overview

This repository is a **Yarn Workspace Monorepo** showcasing enterprise-grade solutions, architectural patterns, and best practices accumulated over 15 years of professional software development. Each project demonstrates different aspects of senior-level engineering expertise.

## 📁 Monorepo Structure

```
showcase/
├── apps/                    # Applications
│   ├── kids-safe-media/        # generates kid-safe versions of movies and TV 
├── libs/                    # Shared Libraries
│   ├── 
└── package.json             # Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Yarn >= 1.22.0

### Installation

```bash
# Install all dependencies for all workspaces
yarn install

# Or install dependencies for a specific workspace
yarn workspace @showcase/kids-safe-media install
```

### Running Projects

```bash
# Run all projects in development mode
yarn dev

# Run a specific project
yarn workspace @showcase/api-gateway dev
yarn workspace @showcase/realtime-collab dev

# Build all projects
yarn build

# Run tests for all projects
yarn test

# Run linting for all projects
yarn lint
```

### Working with Workspaces

```bash
# Add a dependency to a specific workspace
yarn workspace @showcase/api-gateway add express

# Add a dev dependency
yarn workspace @showcase/api-gateway add -D jest

# Use shared libraries in apps
yarn workspace @showcase/api-gateway add @showcase/shared-utils
```

## 📦 Projects

### 1. [Microservices API Gateway](./apps/api-gateway)
**Enterprise API Gateway with Service Mesh**

A production-ready API gateway implementing advanced patterns including:
- Service discovery and load balancing
- Rate limiting and circuit breakers
- Authentication/authorization middleware
- Request/response transformation
- Distributed tracing and observability
- Health checks and graceful degradation

**Technologies:** Node.js, Express, Redis, Docker, Kubernetes, Prometheus, Grafana

**Key Features:**
- Horizontal scalability
- Zero-downtime deployments
- Comprehensive monitoring and alerting
- Security best practices

---

### 2. [Real-Time Collaboration Platform](./apps/realtime-collab)
**WebSocket-Based Collaborative Workspace**

A scalable real-time collaboration platform featuring:
- WebSocket connection management
- Operational Transform (OT) for conflict resolution
- Presence awareness
- Real-time notifications
- Multi-tenant architecture
- Event sourcing for audit trails

**Technologies:** Node.js, Socket.io, Redis Pub/Sub, PostgreSQL, React, TypeScript

**Key Features:**
- Handles 10,000+ concurrent connections
- Conflict-free collaborative editing
- Real-time synchronization
- Scalable architecture

---

### 3. [Infrastructure as Code Platform](./apps/infrastructure-platform)
**Cloud Infrastructure Automation**

Comprehensive IaC solution demonstrating:
- Multi-cloud provisioning (AWS, GCP, Azure)
- Terraform modules and workspaces
- CI/CD pipelines for infrastructure
- Security scanning and compliance
- Cost optimization strategies
- Disaster recovery automation

**Technologies:** Terraform, Ansible, GitHub Actions, AWS CDK, CloudFormation

**Key Features:**
- Infrastructure versioning
- Automated testing
- Multi-environment support
- Security-first approach

---

### 4. [Design System & Component Library](./apps/design-system)
**Enterprise Component Library**

A production-ready design system featuring:
- Accessible components (WCAG 2.1 AA compliant)
- TypeScript-first development
- Comprehensive Storybook documentation
- Visual regression testing
- Theme customization
- Cross-framework compatibility

**Technologies:** React, TypeScript, Storybook, Jest, Testing Library, Chromatic

**Key Features:**
- 50+ reusable components
- Full accessibility support
- Comprehensive test coverage
- Design token system

---

### 5. [Advanced Monorepo Architecture](./apps/monorepo-platform)
**Scalable Monorepo with Micro-Frontends**

A sophisticated monorepo setup demonstrating:
- Workspace orchestration
- Shared library management
- Micro-frontend architecture
- Build optimization
- Dependency management
- Developer experience tooling

**Technologies:** Nx, Turborepo, pnpm, TypeScript, React, Vue

**Key Features:**
- Incremental builds
- Parallel execution
- Code sharing strategies
- Developer productivity tools

---

### 6. [Event-Driven Architecture System](./apps/event-driven-system)
**Message Queue & Event Streaming Platform**

An event-driven system showcasing:
- Event sourcing patterns
- CQRS implementation
- Message queue orchestration
- Event replay capabilities
- Saga pattern for distributed transactions
- Event schema evolution

**Technologies:** Apache Kafka, RabbitMQ, Node.js, PostgreSQL, Redis

**Key Features:**
- High-throughput event processing
- Event replay and time travel
- Distributed transaction management
- Schema registry

---

## 📚 Shared Libraries

### [@showcase/shared-utils](./libs/shared-utils)
Common utility functions used across projects:
- ID generation
- Async utilities (sleep, debounce, throttle)
- Data formatting
- Object manipulation

### [@showcase/shared-types](./libs/shared-types)
Shared TypeScript types and interfaces:
- API response types
- Common data models
- Configuration types

## 🏗️ Architecture Patterns Demonstrated

- **Microservices Architecture** - Service decomposition and communication
- **Event-Driven Architecture** - Loose coupling through events
- **CQRS** - Command Query Responsibility Segregation
- **Domain-Driven Design** - Strategic and tactical patterns
- **API Gateway Pattern** - Centralized API management
- **Circuit Breaker** - Fault tolerance and resilience
- **Saga Pattern** - Distributed transaction management
- **Event Sourcing** - Event-based data persistence
- **Monorepo Architecture** - Workspace management and code sharing

## 🛠️ Technical Skills Showcased

### Backend Development
- RESTful API design
- GraphQL implementation
- WebSocket/real-time systems
- Database design and optimization
- Caching strategies
- Message queue systems

### Frontend Development
- Modern React/Vue patterns
- State management
- Performance optimization
- Accessibility (a11y)
- Progressive Web Apps
- Micro-frontends

### DevOps & Infrastructure
- Containerization (Docker)
- Orchestration (Kubernetes)
- CI/CD pipelines
- Infrastructure as Code
- Monitoring and observability
- Security best practices

### Architecture & Design
- System design
- Scalability patterns
- Performance optimization
- Security architecture
- Code organization
- Documentation

## 📚 Best Practices

Each project follows industry best practices:

- ✅ Comprehensive testing (unit, integration, e2e)
- ✅ Code quality tools (ESLint, Prettier, TypeScript)
- ✅ Documentation (README, API docs, architecture diagrams)
- ✅ Security considerations (OWASP guidelines)
- ✅ Performance optimization
- ✅ Accessibility standards
- ✅ Error handling and logging
- ✅ CI/CD automation
- ✅ Monorepo best practices

## 🔧 Development Workflow

### Adding a New Project

1. Create a new directory in `apps/`
2. Add a `package.json` with name `@showcase/your-project-name`
3. Set `"private": true` in package.json
4. Run `yarn install` from root to link workspace

### Adding a New Shared Library

1. Create a new directory in `libs/`
2. Add a `package.json` with name `@showcase/your-lib-name`
3. Set `"private": true` in package.json
4. Build the library: `yarn workspace @showcase/your-lib-name build`
5. Use in apps: `yarn workspace @showcase/your-app add @showcase/your-lib-name`

## 📝 License

This showcase repository is open source and available under the MIT License.

## 🤝 Contributing

While this is a personal showcase, feedback and suggestions are welcome!

---

**Built with years of experience in enterprise software development, system architecture, and modern engineering practices.**
