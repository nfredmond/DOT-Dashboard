# Planning Manager v6

A modern transportation planning platform that integrates GreenChAMP (Green DOT Chained Activity Modelling Process) and TrendNavigator to help transportation professionals create, analyze, and compare future mobility scenarios.

## Key Features

- **GreenChAMP Travel Demand Modeling**: Perform comprehensive four-step travel demand modeling including trip generation, distribution, mode choice, and assignment.
- **TrendNavigator**: Explore the impacts of emerging mobility trends like telecommuting, autonomous vehicles, and shared mobility services.
- **Scenario Management**: Create, run, compare, and visualize multiple planning scenarios.
- **AI-Powered Insights**: Get intelligent analysis and recommendations based on scenario results.

## Component Overview

### GreenChAMP (Green DOT Chained Activity Modelling Process)

GreenChAMP is an integrated travel demand modeling system that implements the traditional four-step model with modern enhancements:

1. **Trip Generation**: Calculates the number of trips produced and attracted by each zone.
2. **Trip Distribution**: Distributes trips between origins and destinations.
3. **Mode Choice**: Splits trips between available modes (car, transit, walk, bike, etc.).
4. **Network Assignment**: Assigns trips to the transportation network.

### TrendNavigator

TrendNavigator helps planners incorporate emerging trends into their scenarios:

- **Trend Library**: Pre-configured trends like telecommuting, e-commerce, micromobility, and autonomous vehicles.
- **Scenario Creation**: Quickly create scenarios that incorporate one or more trends.
- **Comparison Tools**: Compare how different trends impact transportation outcomes.

### Scenario Management

- Create, edit, and manage planning scenarios
- Run GreenChAMP travel demand models
- View detailed results and metrics
- Compare multiple scenarios side-by-side

### AI Features

- Scenario insights generation
- Pattern recognition across model runs
- Policy recommendations based on goals

## Technical Components

- **Frontend**: React with Next.js and Tailwind CSS
- **Backend**: Node.js API layer
- **Database**: PostgreSQL with Supabase
- **AI Services**: OpenAI and Anthropic integrations
- **Visualization**: MapLibre and Recharts

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account (for database)
- OpenAI or Anthropic API key (for AI features)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/planning-manager-v6.git
   cd planning-manager-v6
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env.local
   ```
   Then edit .env.local with your API keys and configuration.

4. Run the development server:
   ```
   npm run dev
   ```

### Configuration

1. Configure your Supabase connection in `.env.local`
2. Add your AI provider API keys in `.env.local`
3. Customize zone and network data in the GreenChAMP configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Leaflet](https://leafletjs.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenAI](https://openai.com/)
- [OpenAI Agents SDK](https://platform.openai.com/docs/agents)
- [Anthropic](https://www.anthropic.com/)
- [Green DOT Transportation Solutions](https://greendottransportation.com)
