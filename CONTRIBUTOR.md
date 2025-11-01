# 🌟 Contributing to Neo UI Framework

Thank you for your interest in contributing to Neo UI Framework! This document provides guidelines and best practices for contributing to the project.

## How to Contribute

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose (for containerized deployment)
- Access to a NetApp Neo API instance
- A running Neo instance [Neo Quickstart](https://github.com/NetApp/Innovation-Labs/tree/main/netapp-neo)

### Core
- React 19.1 - UI framework
- TypeScript 5.9 - Type safety
- Vite 7.1 - Build tool and dev server
- React Router 7.9 - Client-side routing

### UI Components
- shadcn/ui - Component primitives
- Radix UI - Accessible component foundations
- Tailwind CSS 4.1 - Utility-first styling
- Tabler Icons - Icon set
- Recharts 2.15 - Data visualization

### Forms & Validation
- React Hook Form 7.65 - Form management
- Zod 4.1 - Schema validation

### Utilities
- clsx, tailwind-merge - Class name utilities
- date-fns - Date manipulation
- sonner - Toast notifications

### Project Structure

```
neo-ui-framework/
├── src/
│   ├── components/
│   │   ├── data-tables/     # Table components for data display
│   │   ├── dialogs/         # Modal dialogs and forms
│   │   ├── navs/            # Navigation components
│   │   ├── pages/           # Main page components
│   │   ├── sections/        # Reusable page sections
│   │   ├── services/        # API service layer
│   │   ├── sidebars/        # Sidebar navigation
│   │   └── ui/              # shadcn/ui primitives
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
├── Dockerfile               # Production container image
├── docker-compose.yml       # Development orchestration
├── nginx.conf              # nginx configuration template
├── entrypoint.sh           # Container startup script
└── vite.config.ts          # Vite configuration
```

### Getting Started

1. **Fork & clone the Repository**
   Fork the repo from GitHub to your nickhandle/organization then clone:

   ```bash
   git clone https://github.com/your-username/neo-ui-framework.git
   cd neo-ui-framework
   npm install
   ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Start the development server with hot reload**

    - Start your Neo API backend
    - Update proxy target in `vite.config.ts` if needed
    - Run `npm run dev`
    - Click the "Key" icon and enter your Neo credentials

5. **Make Your Changes**
   - Write clean, readable code
   - Follow existing patterns and conventions
   - Add comments for complex logic

6. **Linting Your Changes**
   ```bash
   npm run lint
   ```

7. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve issue description"
   ```

8. **Building**
    ```bash
    npm run build
    ```
    Preview the production build:

    ```bash
    npm run preview
    ```

9. **Build and run your own container**
    ```bash
    docker build -t neo-ui-framework .
    docker run -d -p 8080:80 -e NEO_API=http://your-neo-api:8080 neo-ui-framework
    ```
    See [QUICKSTART.md](QUICKSTART.md) for more details. 

10. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Convention

We follow the Conventional Commits specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add file search dialog with advanced filters
fix: resolve authentication token expiration issue
docs: update API integration examples
refactor: simplify share form validation logic
```

## Development Standards

### TypeScript

- **Strict Mode**: **Always enabled** (`tsconfig.json`)
- **Type Everything**: Avoid `any`, use proper types or `unknown`
- **Type Imports**: Use `import type` for type-only imports when `verbatimModuleSyntax` is enabled
  ```typescript
  import type { UserResponse } from '@/components/services/models'
  import { NeoApiService } from '@/components/services/neo-api'
  ```

### React & Components

- **Functional Components**: Use function components with hooks
- **Hooks**: Follow React hooks rules (use eslint-plugin-react-hooks)
- **Props**: Define explicit interface for component props
  ```typescript
  interface MyComponentProps {
    data: DataType
    onAction: (id: string) => void
  }
  
  export function MyComponent({ data, onAction }: MyComponentProps) {
    // ...
  }
  ```

### Styling

- **Tailwind Classes**: Use utility classes, avoid custom CSS when possible
- **shadcn/ui**: Don't modify generated components in `src/components/ui/`
- **Responsive**: Mobile-first approach with breakpoint prefixes
  ```tsx
  <div className="flex flex-col gap-4 md:flex-row lg:gap-6">
  ```

### Code Organization

- **File Structure**: Follow existing patterns
  - Pages → `src/components/pages/`
  - Data tables → `src/components/data-tables/`
  - Dialogs → `src/components/dialogs/`
  - Services → `src/components/services/`
- **Imports**: Use `@/` alias for src imports
  ```typescript
  import { Button } from '@/components/ui/button'
  import { NeoApiService } from '@/components/services/neo-api'
  ```

### State Management

- **Local State**: Prefer `useState` for component-specific state
- **Shared State**: Use props drilling or lift state up
- **API State**: Managed in `App.tsx` via `useNeoApi` hook
- **Forms**: Use `react-hook-form` with Zod validation

### Error Handling

- **Try-Catch**: Wrap API calls appropriately
- **User Feedback**: Use toast notifications (sonner)
  ```typescript
  import { toast } from 'sonner'
  
  try {
    await apiCall()
    toast.success('Operation completed!')
  } catch (error) {
    toast.error('Operation failed!')
  }
  ```
- **Authentication Errors**: Throw `AuthenticationError` for session issues

## Testing & Validation

### Before Submitting PR

1. **Lint Check**
   ```bash
   npm run lint
   ```
   - Fix all warnings and errors
   - Don't disable rules without discussion

2. **Type Check**
   ```bash
   npm run build
   ```
   - Ensure no TypeScript errors
   - Verify build completes successfully

3. **Visual Testing**
   - Test in both light and dark themes
   - Check responsive behavior (mobile, tablet, desktop)
   - Verify all interactive elements work

4. **Cross-Browser** (if applicable)
   - Test in Chrome, Firefox, Safari
   - Ensure consistent behavior

### Adding New Features

When adding new features, consider:

1. **API Integration**
   - Add types to `models.tsx`
   - Add methods to `neo-api.tsx`
   - Update `fetchSystemData` if needed

2. **UI Components**
   - Use existing shadcn/ui components
   - Add new ones via `npx shadcn@latest add <component>`

3. **Documentation**
   - Update README.md with new features
   - Add inline comments for complex logic
   - Update prop interfaces with JSDoc if helpful

## UI/UX Guidelines

### Accessibility

- **Semantic HTML**: Use proper HTML elements
- **ARIA Labels**: Add labels for screen readers
- **Keyboard Navigation**: Ensure all actions are keyboard-accessible
- **Focus Management**: Visible focus indicators

### Consistency

- **Component Patterns**: Follow existing patterns for similar features
- **Spacing**: Use Tailwind spacing scale consistently
- **Colors**: Use theme color variables
  ```tsx
  className="bg-background text-foreground border-border"
  ```

### User Feedback

- **Loading States**: Show spinners/skeletons during data fetch
- **Error States**: Display clear error messages
- **Success States**: Confirm successful actions with toasts
- **Empty States**: Provide helpful messages when no data

## Adding Dependencies

Before adding new dependencies:

1. **Check Alternatives**: See if existing dependencies can solve the problem
2. **Bundle Size**: Consider impact on bundle size
3. **Maintenance**: Check if the package is actively maintained
4. **Discussion**: Open an issue to discuss the addition

When adding:
```bash
npm install package-name
# Update package.json
```

## Code Review Process

### What Reviewers Look For

- **Code Quality**: Readable, maintainable, follows patterns
- **Type Safety**: Proper TypeScript usage
- **Performance**: No obvious performance issues
- **Security**: No security vulnerabilities
- **Documentation**: Clear comments and docs
- **Testing**: Changes work as expected

### Responding to Feedback

- **Be Responsive**: Address feedback promptly
- **Ask Questions**: If feedback is unclear, ask for clarification
- **Discussion**: Engage in constructive technical discussion
- **Update**: Make requested changes and push updates

## Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, Neo version
6. **Screenshots**: If applicable
7. **Console Errors**: Any errors in browser console

## Feature Requests

When requesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: Your idea for solving it
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Any other relevant information

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Vite Documentation](https://vite.dev/)

## Community Guidelines

- **Be Respectful**: Treat others with respect and kindness
- **Be Constructive**: Provide helpful, constructive feedback
- **Be Patient**: Everyone is learning and improving
- **Be Inclusive**: Welcome contributors of all skill levels
- **Be Professional**: Maintain a professional tone in all communications

## ❓ Questions?

If you have questions:

1. Search existing issues
2. Ask in the discussion forum
3. Contact maintainers

---

Thank you for contributing to Neo UI Framework! 🎉