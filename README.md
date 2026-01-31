<div align="center">

# 💰 Minimalist Wealth

**Take control of your finances with a beautiful, minimalist approach**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## ✨ Features

🎤 **Voice Commands** - Add transactions by simply speaking. Say _"Gasté 5000 pesos en el super"_ and we'll do the rest.

📊 **Visual Reports** - Beautiful charts and graphs to understand your spending patterns and trends.

🐷 **Savings Goals** - Set and track savings goals with progress visualization and contribution tracking.

💱 **Multi-Currency** - Support for USD, ARS, and EUR with automatic exchange rate conversion using [Dolar API](https://dolarapi.com).

🔐 **Secure** - Your data is encrypted and protected with JWT authentication.

📱 **Mobile Ready** - Fully responsive design that works on any device.

---

## 🎬 Demo

<!-- Add screenshots or GIFs of your app here -->
<!-- ![Dashboard Screenshot](./docs/screenshots/dashboard.png) -->

> 🚧 Demo coming soon!

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher
- **PostgreSQL** database (or [Supabase](https://supabase.com) account)

### Installation

```bash
# Clone the repository
git clone https://github.com/Fransaya/personalfinance.git
cd personalfinance

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
# (See database/schema-sql-personalfinance-app.txt for schema)

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable                | Description                         | Required |
| ----------------------- | ----------------------------------- | -------- |
| `DATABASE_URL`          | PostgreSQL connection string        | ✅       |
| `JWT_SECRET`            | Secret key for JWT tokens           | ✅       |
| `JWT_EXPIRES_IN`        | Token expiration (e.g., `7d`)       | ✅       |
| `EXCHANGE_RATE_API_URL` | Exchange rate API URL               | ❌       |
| `OPENAI_API_KEY`        | OpenAI API key for voice processing | ❌       |
| `NEXT_PUBLIC_APP_URL`   | Public app URL                      | ❌       |

---

## 🛠 Tech Stack

| Category            | Technology                                                  |
| ------------------- | ----------------------------------------------------------- |
| **Framework**       | [Next.js 16](https://nextjs.org/) (App Router)              |
| **Language**        | [TypeScript 5](https://www.typescriptlang.org/)             |
| **Styling**         | [Tailwind CSS 4](https://tailwindcss.com/)                  |
| **UI Components**   | [Radix UI](https://www.radix-ui.com/)                       |
| **Charts**          | [Recharts](https://recharts.org/)                           |
| **Database**        | [PostgreSQL](https://www.postgresql.org/)                   |
| **ORM**             | [node-postgres (pg)](https://node-postgres.com/)            |
| **Authentication**  | JWT with [bcryptjs](https://www.npmjs.com/package/bcryptjs) |
| **Validation**      | [Zod](https://zod.dev/)                                     |
| **Package Manager** | [pnpm](https://pnpm.io/)                                    |

---

## 📁 Project Structure

```
personalfinance/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and configurations
│   └── types/                 # TypeScript type definitions
├── database/                  # Database schema and migrations
├── public/                    # Static assets
└── ...config files
```

---

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to read our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Dolar API](https://dolarapi.com) for providing exchange rate data for Argentine peso
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Lucide Icons](https://lucide.dev/) for beautiful icons

---

<div align="center">

Made with ❤️ by the Minimalist Wealth community

⭐ Star this repo if you find it useful!

</div>
