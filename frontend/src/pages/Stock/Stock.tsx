import DefaultLayout from '@component/default';
import { useEffect, useState } from 'react';
import './Stock.css';

interface StockItem {
    id: number;
    weight: number;
    label: string;
    description: string | null;
    stock: number;
    command: [number]
}

export default function Stock() {
    const [stocks, setStocks] = useState<StockItem[]>([]);

    useEffect(() => {
        fetch('/src/data/stock.json')
            .then(response => response.json())
            .then(data => setStocks(data.stocks));
    }, []);

    return (
        <DefaultLayout>
            <h1>Suivis du stock</h1>
            <table>
                <thead>
                    <tr>
                        <th>Article ID</th>
                        <th>Label</th>
                        <th>Description</th>
                        <th>Stock</th>
                        <th>Poids</th>
                        <th>Commandes</th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.map(stock => (
                        <tr key={stock.id}>
                            <td>{stock.id}</td>
                            <td>{stock.label}</td>
                            <td>{stock.description || 'N/A'}</td>
                            <td>{stock.stock}</td>
                            <td>{stock.weight} kg</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </DefaultLayout>
    );
}