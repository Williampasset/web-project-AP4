import './Affectation.css';
import DefaultLayout from '@component/default';
import { useEffect, useState } from 'react';

import User from '@data/users.json';
console.log(User);
import Stock from '@data/stock.json';
console.log(Stock);
import Command from '@data/commands.json';
console.log(Command);


export default function Affectation(){
    return (
        <DefaultLayout>
            <h1>Affectation des tâches</h1>


        </DefaultLayout>
    );
}