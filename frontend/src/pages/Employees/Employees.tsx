import DefaultLayout from '@component/default';
import { useEffect, useState } from 'react';
import './Employees.css';

interface Employee {
  id: number;
  matricule: string;
  lastName: string;
  firstName: string;
  managerId: number | null;
  role: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetch('/src/data/users.json')
      .then(response => response.json())
      .then(data => setEmployees(data.users || []));
  }, []);

  return (
    <DefaultLayout>
      <div className="employees-page">
        <h1>Liste des employés</h1>
        <div className="employees-table-wrapper">
          {employees.length === 0 ? (
            <div className="employees-loading">Chargement des employés...</div>
          ) : (
            <table className="employees-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Matricule</th>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Manager</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => {
                  const manager = employee.managerId
                    ? employees.find(item => item.id === employee.managerId)
                    : null;

                  return (
                    <tr key={employee.id}>
                      <td>{employee.id}</td>
                      <td>{employee.matricule}</td>
                      <td>{employee.firstName}</td>
                      <td>{employee.lastName}</td>
                      <td>{employee.role}</td>
                      <td>{manager ? `${manager.firstName} ${manager.lastName}` : 'Aucun'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}
