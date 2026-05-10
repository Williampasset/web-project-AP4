import DefaultLayout from '@component/default/DefaultLayout';
import Loading from '@component/Loading/Loading';
import SupplierRow from '@component/SupplierRow/SupplierRow';
import { useSuppliersPage } from './useSuppliersPage';
import './Suppliers.css';

export default function Suppliers() {
  const {
    isLoading,
    isError,
    error,
    refetch,
    search,
    setSearch,
    freeTransitLocations,
    filteredSuppliers,
  } = useSuppliersPage();

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <DefaultLayout>
        <div className='suppliers-error'>
          <h2>Erreur de chargement</h2>
          <p>
            {(error as Error)?.message ??
              'Impossible de charger les fournisseurs.'}
          </p>
          <button onClick={() => refetch()}>Réessayer</button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className='suppliers-page'>
        <div className='suppliers-page__header'>
          <h1>Fournisseurs</h1>
          <p>
            {filteredSuppliers.length} fournisseur
            {filteredSuppliers.length !== 1 ? 's' : ''}
          </p>
        </div>

        <input
          type='text'
          placeholder='Rechercher par fournisseur, article, référence…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='suppliers-page__search'
        />

        {filteredSuppliers.length === 0 ? (
          <p className='suppliers-page__empty'>Aucun fournisseur trouvé.</p>
        ) : (
          <div className='suppliers-page__list'>
            {filteredSuppliers.map((supplier) => (
              <SupplierRow
                key={supplier.id}
                supplier={supplier}
                search={search}
                freeTransitLocations={freeTransitLocations}
              />
            ))}
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
