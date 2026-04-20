import DefaultLayout from '@component/default';
import { useState } from 'react';
import type { StockItem } from '@type/StockItem';
import type { Command } from '@type/Command';
import articlesData from '@data/articles.json';
import suppliersData from '@data/suppliers.json';
import commandsData from '@data/commands.json';
import './Stock.css';

interface Supplier {
    id: number;
    name: string;
    address: string;
    articleIds: number[];
}

export default function Stock() {
    const stocks: StockItem[] = articlesData.articles as StockItem[];
    const suppliers: Supplier[] = suppliersData.suppliers as Supplier[];
    const commands: Command[] = commandsData.commands as Command[];
    const [searchFilter, setSearchFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrArticleId, setQrArticleId] = useState<number | null>(null);

    const getTotalCommandedQuantity = (articleId: number): number => {
        const total = commands
            .filter(cmd => cmd.articleIds.includes(articleId) && cmd.status !== 'FINISH')
            .reduce((total, cmd) => total + (cmd.weight ?? 1), 0);
        return Math.ceil(total);
    };

    const isStockOvercommitted = (stock: StockItem): boolean => {
        const totalCommanded = getTotalCommandedQuantity(stock.id);
        return totalCommanded > stock.stock;
    };

    const filtered = stocks.filter(stock =>
        stock.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
        stock.id.toString().includes(searchFilter)
    );

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return 'out-of-stock';
        if (quantity < 10) return 'low-stock';
        return 'in-stock';
    };

    const getStockLabel = (quantity: number) => {
        if (quantity === 0) return '✗ Rupture';
        if (quantity < 10) return '⚠ Faible';
        return '✓ Disponible';
    };

    const openSupplierModal = (articleId: number) => {
        setSelectedArticleId(articleId);
        setModalOpen(true);
    };

    const getSuppliers = (articleId: number): Supplier[] => {
        return suppliers.filter(s => s.articleIds.includes(articleId));
    };

    const requestQuote = (supplierId: number, supplierName: string) => {
        alert(`Demande de devis envoyée à ${supplierName} (ID: #${supplierId})\n`);
    };

    const openQRModal = (articleId: number) => {
        setQrArticleId(articleId);
        setQrModalOpen(true);
    };

    const getQRCodeUrl = (articleId: number): string => {
        const data = JSON.stringify({ articleId, label: stocks.find(s => s.id === articleId)?.label });
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
    };

    return (
        <DefaultLayout>
            <h1>Suivi du stock</h1>
            
            <div className="stock-search">
                <input
                    type="text"
                    placeholder="Rechercher par ID ou label..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="search-input"
                />
            </div>

            <table className="stock-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Label</th>
                        <th>Description</th>
                        <th>Quantité</th>
                        <th>Poids</th>
                        <th>État</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(stock => (
                        <tr key={stock.id} className={`row-${getStockStatus(stock.stock)} ${isStockOvercommitted(stock) ? 'overcommitted' : ''}`}>
                            <td>#{stock.id}</td>
                            <td>
                                <div>{stock.label}</div>
                                {isStockOvercommitted(stock) && (
                                    <span className="alert-overcommitted">⚠️ Surengagement</span>
                                )}
                            </td>
                            <td>{stock.description || '—'}</td>
                            <td className="stock-quantity">
                                <div>{stock.stock}</div>
                                {isStockOvercommitted(stock) && (
                                    <div className="commands-info">Demandé: {getTotalCommandedQuantity(stock.id)}</div>
                                )}
                            </td>
                            <td>{stock.weight} kg</td>
                            <td>
                                <span className={`stock-status ${getStockStatus(stock.stock)} ${isStockOvercommitted(stock) ? 'overcommitted' : ''}`}>
                                    {isStockOvercommitted(stock) ? '❌ Surengagé' : getStockLabel(stock.stock)}
                                </span>
                            </td>
                            <td>
                                <button
                                    className="supplier-btn"
                                    onClick={() => openSupplierModal(stock.id)}
                                >
                                    Fournisseurs
                                </button>
                                <button
                                    className="qr-btn"
                                    onClick={() => openQRModal(stock.id)}
                                    title="Générer QR Code"
                                >
                                    📱 QR
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={7}>Aucun article trouvé.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Modal Fournisseurs */}
            {modalOpen && selectedArticleId !== null && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Fournisseurs pour l'article #{selectedArticleId}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {getSuppliers(selectedArticleId).length > 0 ? (
                                <div className="suppliers-list">
                                    {getSuppliers(selectedArticleId).map(supplier => (
                                        <div key={supplier.id} className="supplier-card">
                                            <div className="supplier-info">
                                                <h3>{supplier.name}</h3>
                                                <p className="supplier-address">
                                                    📍 {supplier.address}
                                                </p>
                                            </div>
                                            <button
                                                className="quote-btn"
                                                onClick={() => requestQuote(supplier.id, supplier.name)}
                                            >
                                                Demander un devis
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Aucun fournisseur trouvé pour cet article.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal QR Code */}
            {qrModalOpen && qrArticleId !== null && (
                <div className="modal-overlay" onClick={() => setQrModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>QR Code - Article #{qrArticleId}</h2>
                            <button className="modal-close" onClick={() => setQrModalOpen(false)}>✕</button>
                        </div>
                        <div className="modal-body qr-body">
                            <div className="qr-container">
                                <img 
                                    src={getQRCodeUrl(qrArticleId)} 
                                    alt={`QR Code article ${qrArticleId}`}
                                    className="qr-code-img"
                                />
                                <p className="qr-label">{stocks.find(s => s.id === qrArticleId)?.label}</p>
                            </div>
                            <button
                                className="download-btn"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = getQRCodeUrl(qrArticleId);
                                    link.download = `QR_Article_${qrArticleId}.png`;
                                    link.click();
                                }}
                            >
                                ⬇️ Télécharger
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DefaultLayout>
    );
}