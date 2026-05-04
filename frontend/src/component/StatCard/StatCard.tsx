import { BarChart3, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: number;
  variant: 'default' | 'waiting' | 'pending' | 'delivered' | 'cancelled';
}

const iconMap = {
  default: BarChart3,
  waiting: Clock,
  pending: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function StatCard({ label, value, variant }: StatCardProps) {
  const IconComponent = iconMap[variant];

  return (
    <div className={`stat-card stat-card--${variant}`}>
      <IconComponent className='stat-card__icon' size={28} />
      <p className='stat-card__value'>{value}</p>
      <p className='stat-card__label'>{label}</p>
    </div>
  );
}
