interface DashboardHeaderProps {
  title: string;
  description: string;
}

export const DashboardHeader = ({ title, description }: DashboardHeaderProps) => (
  <div className="mb-8">
    <h1 className="text-3xl font-bold mb-2 text-gradient">{title}</h1>
    <p className="text-muted-foreground">{description}</p>
  </div>
);