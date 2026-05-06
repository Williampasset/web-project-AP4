import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '@service/api/articles.service';
import { fetchCommands } from '@service/api/commands.service';
import { fetchSuppliers } from '@service/api/suppliers.service';
import type { Article } from '@type/article.type';
import type { Command } from '@type/command.type';
import type { Supplier } from '@type/supplier.type';
import './Stock.css';

const PENDING_LOADING_STATUSES: Command['status'][] = ['WAITING', 'PENDING'];

export default function Stock() {
  const [searchFilter, setSearchFilter] = useState('');

  const {
    data: articles = [],
    isLoading: isLoadingArticles,
    isError: isErrorArticles,
    error: articlesError,
    dataUpdatedAt: articlesUpdatedAt,
    refetch: refetchArticles,
  } = useQuery<Article[]>({
    queryKey: ['articles', 'live-stock'],
    queryFn: fetchArticles,
    refetchInterval: 10000,
  });

  const {
    data: commands = [],
    isLoading: isLoadingCommands,
    isError: isErrorCommands,
    error: commandsError,
    dataUpdatedAt: commandsUpdatedAt,
    refetch: refetchCommands,
  } = useQuery<Command[]>({
    queryKey: ['commands', 'live-stock'],
    queryFn: () => fetchCommands(),
    refetchInterval: 10000,
  });

  const {
    data: suppliers = [],
    isLoading: isLoadingSuppliers,
    isError: isErrorSuppliers,
    error: suppliersError,
    dataUpdatedAt: suppliersUpdatedAt,
    refetch: refetchSuppliers,
  } = useQuery<Supplier[]>({
    queryKey: ['suppliers', 'live-stock'],
    queryFn: fetchSuppliers,
    refetchInterval: 10000,
  });

  const articleSupplierNameById = useMemo(() => {
    const map = new Map<number, string>();

    suppliers.forEach((supplier) => {
      supplier.articles.forEach((article) => {
        map.set(article.id, supplier.name);
      });
    });

    return map;
  }, [suppliers]);

  const articleLocationById = useMemo(() => {
    const map = new Map<number, string>();

    suppliers.forEach((supplier) => {
      supplier.articles.forEach((article) => {
        const location = article.location;
        if (!location) return;
        map.set(
          article.id,
          `${location.building}-${location.aisle}-${location.shelf}-${location.cell}`,
        );
      });
    });

    return map;
  }, [suppliers]);

  const pendingDemandByArticle = useMemo(() => {
    const map = new Map<number, number>();

    commands
      .filter((command) => PENDING_LOADING_STATUSES.includes(command.status))
      .forEach((command) => {
        command.items.forEach((item) => {
          map.set(item.articleId, (map.get(item.articleId) ?? 0) + item.quantity);
        });
      });

    return map;
  }, [commands]);

  const rows = useMemo(() => {
    return articles.map((article) => {
      const pendingQty = pendingDemandByArticle.get(article.id) ?? 0;
      const projectedStock = article.stock - pendingQty;
      return {
        article,
        pendingQty,
        projectedStock,
        shortage: projectedStock < 0,
      };
    });
  }, [articles, pendingDemandByArticle]);

  const filtered = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter(({ article }) => {
      const supplierName = (
        article.supplier?.name ||
        articleSupplierNameById.get(article.id) ||
        ''
      ).toLowerCase();
      const location = (
        (article.location
          ? `${article.location.building}-${article.location.aisle}-${article.location.shelf}-${article.location.cell}`
          : '') ||
        articleLocationById.get(article.id) ||
        ''
      ).toLowerCase();

      return (
        article.reference.toLowerCase().includes(query) ||
        article.label.toLowerCase().includes(query) ||
        supplierName.includes(query) ||
        location.includes(query)
      );
    });
  }, [rows, searchFilter, articleSupplierNameById, articleLocationById]);

  const stats = useMemo(() => {
    const total = rows.length;
    const shortages = rows.filter((r) => r.shortage).length;
    const lowSoon = rows.filter((r) => !r.shortage && r.projectedStock <= 5).length;

    return { total, shortages, lowSoon };
  }, [rows]);

  const formatSupplier = (article: Article) => {
    if (article.supplier?.name) return article.supplier.name;
    if (articleSupplierNameById.has(article.id)) {
      return articleSupplierNameById.get(article.id);
    }
    return 'Non renseigné';
  };

  const formatLocation = (article: Article) => {
    if (
      article.location &&
      article.location.building &&
      article.location.aisle !== undefined &&
      article.location.shelf !== undefined &&
      article.location.cell !== undefined
    ) {
      return `${article.location.building}-${article.location.aisle}-${article.location.shelf}-${article.location.cell}`;
    }

    if (articleLocationById.has(article.id)) {
      return articleLocationById.get(article.id);
    }

    return 'Non renseigné';
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity < 10) return 'low-stock';
    return 'in-stock';
  };

  const isLoading = isLoadingArticles || isLoadingCommands || isLoadingSuppliers;
  const isError = isErrorArticles || isErrorCommands || isErrorSuppliers;
  const lastUpdatedAt = Math.max(
    articlesUpdatedAt || 0,
    commandsUpdatedAt || 0,
    suppliersUpdatedAt || 0,
  );

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <DefaultLayout>
        <div className='stock-error'>
          <p>
            Erreur :
            {' '}
            {(articlesError as Error)?.message ||
              (commandsError as Error)?.message ||
              (suppliersError as Error)?.message ||
              'Impossible de charger les données de stock.'}
          </p>
          <button
            onClick={() => {
              refetchArticles();
              refetchCommands();
              refetchSuppliers();
            }}
          >
            Réessayer
          </button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className='stock-page-header'>
        <div>
          <h1>Suivi des stocks en temps réel</h1>
          <p>
            Dernière mise à jour :
            {' '}
            {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString('fr-FR') : '--:--:--'}
            {' '}
            (rafraîchissement auto toutes les 10s)
          </p>
        </div>
      </div>

      <div className='stock-kpis'>
        <div className='kpi-card'>
          <span>Articles suivis</span>
          <strong>{stats.total}</strong>
        </div>
        <div className='kpi-card kpi-card--warn'>
          <span>Pénuries probables</span>
          <strong>{stats.shortages}</strong>
        </div>
        <div className='kpi-card kpi-card--low'>
          <span>Stock faible à court terme</span>
          <strong>{stats.lowSoon}</strong>
        </div>
      </div>

      <div className='stock-search'>
        <input
          type='text'
          placeholder='Rechercher par référence, article, fournisseur ou emplacement...'
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className='search-input'
        />
      </div>

      <table className='stock-table'>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Label</th>
            <th>Stock actuel</th>
            <th>Demandé (attente/chargement)</th>
            <th>Stock projeté</th>
            <th>Risque</th>
            <th>Fournisseur</th>
            <th>Emplacement</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ article, pendingQty, projectedStock, shortage }) => (
            <tr
              key={article.id}
              className={`row-${getStockStatus(article.stock)} ${shortage ? 'overcommitted' : ''}`}
            >
              <td>{article.reference}</td>
              <td>{article.label}</td>
              <td>{article.stock}</td>
              <td>{pendingQty}</td>
              <td className={projectedStock < 0 ? 'negative-stock' : ''}>{projectedStock}</td>
              <td>
                {shortage ? (
                  <span className='stock-status overcommitted'>❌ Pénurie probable</span>
                ) : projectedStock <= 5 ? (
                  <span className='stock-status low-stock'>⚠️ Bas</span>
                ) : (
                  <span className='stock-status in-stock'>✅ OK</span>
                )}
              </td>
              <td>
                {formatSupplier(article)}
              </td>
              <td>
                {formatLocation(article)}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8}>Aucun article trouvé.</td>
            </tr>
          )}
        </tbody>
      </table>
    </DefaultLayout>
  );
}
