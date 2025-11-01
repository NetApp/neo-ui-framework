# Neo UI Framework

A modern, production-ready React + TypeScript UI framework that provides complete coverage of the NetApp Neo API. Built with Vite, shadcn/ui, and Tailwind CSS, this framework is designed to be forked, white-labeled, and extended by our customers and partners.

> [!IMPORTANT]
> Neo UI Framework is intended for developement deployments and white-labeled solutions. Please follow the guidelines below to your keep deployments secure.

This framework is used to build the UI shipped with NetApp Neo.

## 🎯 Overview

Neo UI Framework delivers a full-featured interface for managing NetApp Neo - the connector that enables organizations to securely connect their data to Gen AI platforms like Microsoft 365 Copilot without migration or policy changes.

## ✨ Key Features

- **Complete API Coverage** - Full integration with Neo API including authentication, health monitoring, license management, user administration, share management, file operations, and activity logging
- **Modern Tech Stack** - Built with React 19, TypeScript 5.9, Vite 7, and Tailwind CSS 4
- **Production Ready** - Containerized deployment with nginx, Docker Compose support, and environment-based configuration
- **White-Label Friendly** - Easily customize branding, themes, and navigation to match your organization
- **Type-Safe** - Comprehensive TypeScript coverage with strict compiler options
- **Responsive Design** - Mobile-first approach with adaptive layouts and sidebar navigation
- **Search & Filter** - Advanced file search across shares with comprehensive filtering options
- **Real-time Updates** - Live status monitoring and operation tracking

## 📚 Key Features by Page

### Dashboard
- System health metrics (CPU, memory, disk)
- License status and expiration
- Version information
- Visual charts and statistics

### Shares
- List all configured SMB shares
- Add/edit share configurations
- Schedule automated crawls (cron expressions)
- Start manual crawls
- View detailed share information
- Advanced configuration (Kerberos, realm, workgroup)

### Files
- Browse files across all shares
- Advanced search with filters:
  - File path and name
  - File type/extension
  - Date ranges (accessed, modified, created)
  - Size ranges
  - Sort by multiple fields
- View file metadata
- Paginated results

### Operations
- Real-time operation log
- Filter by type and status
- User attribution
- Timestamp tracking

### Users
- User management
- Role-based access (admin/standard)
- Password management
- Active/inactive status

## 🤝 Quick Start

Please see [QUICKSTART.md](QUICKSTART.md) to run Neo UI framework:
- from sources
- with Docker/Podman

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTOR.md](CONTRIBUTOR.md) for:
- Branch and workflow guidelines
- Code standards and linting rules
- Testing requirements
- Pull request process

## 🔒 Security

Security is critical for production deployments. See [SECURITY.md](SECURITY.md) for:
- Vulnerability reporting process
- Security best practices
- Runtime hardening guidelines
- Incident response procedures

## 📄 License

This project is part of the NetApp Innovation Labs initiative. Please refer to your organization's licensing policy when forking or redistributing.

## 🆘 Support

For issues, questions, or feature requests:
1. Check the [FAQ](https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/FAQ.md)
2. Review existing [GitHub issues](https://github.com/NetApp/Innovation-Labs/issues)
3. Contact your NetApp representative

## 🎨 White-Label Customization

### Branding

1. **Logo & Title** - Update [`src/components/sidebars/sidebarheader.tsx`](src/components/sidebars/sidebarheader.tsx)
2. **Favicon** - Replace `public/netapp.svg`
3. **Page Title** - Edit `index.html`

### Theming

1. **Colors & Variables** - Modify CSS custom properties in `src/index.css`
2. **Component Styles** - Update Tailwind configuration in `tailwind.config.js`
3. **Theme Toggle** - Customize light/dark mode in [`src/components/navs/theme-provider.tsx`](src/components/navs/theme-provider.tsx)

### Navigation

1. **Menu Items** - Edit [`src/components/sidebars/sidebar-content.tsx`](src/components/sidebars/sidebar-content.tsx)
2. **Routes** - Update routing in [`src/App.tsx`](src/App.tsx)
3. **Page Content** - Modify components in `src/components/pages/`

## 🔌 API Integration

The application uses [`src/components/services/neo-api.tsx`](src/components/services/neo-api.tsx) as the single source of API communication. Key features:

- **Type-safe** - Full TypeScript definitions for all endpoints
- **Token-based auth** - JWT bearer token authentication
- **Error handling** - Automatic session expiration detection
- **Centralized config** - Single base URL configuration

All API types are exported from [`src/components/services/models.tsx`](src/components/services/models.tsx).

---
Built with ❤️ by the NetApp Innovation Labs team