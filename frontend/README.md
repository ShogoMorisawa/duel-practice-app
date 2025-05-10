# React Frontend

This is the frontend application for the Dueling Cards App, built with React, Vite, and Tailwind CSS.

## Authentication Features

- ✅ Login functionality with JWT
- ✅ Auto-insertion of Authorization header via Axios interceptors
- ✅ User registration form
- ✅ Logout with API call
- ✅ Automatic user profile loading on startup when token exists
- ✅ Protected routes redirecting to login

## Development

```
npm install
npm run dev
```

## Build for production

```
npm run build
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
