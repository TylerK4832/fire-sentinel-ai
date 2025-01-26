import { Card, CardContent } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from "../../hooks/use-mobile";

interface TrendChartProps {
  data: Array<{
    time: string;
    avgProbability: number;
  }>;
}

export const TrendChart = ({ data }: TrendChartProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className="glass-morphism">
      <CardContent className={`pt-6 ${isMobile ? 'px-2' : 'px-6'}`}>
        <h2 className="text-lg font-semibold mb-4 text-gradient">Fire Probability</h2>
        <div className={`${isMobile ? 'h-[250px]' : 'h-[300px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data}
              margin={isMobile ? 
                { top: 5, right: 10, left: 0, bottom: 20 } : 
                { top: 5, right: 30, left: 20, bottom: 25 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
              <XAxis 
                dataKey="time" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={Math.ceil(data.length / (isMobile ? 4 : 6))}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                label={{ 
                  value: 'Fire Probability (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: 'currentColor',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
                labelStyle={{ color: 'white' }}
              />
              <Line 
                type="monotone" 
                dataKey="avgProbability" 
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#ef4444' }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
