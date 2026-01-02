<?php

namespace App\Filament\Resources\WalletTransactions\Tables;

use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class WalletTransactionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->label('User')
                    ->searchable(),
                TextColumn::make('type')
                    ->badge()
                    ->sortable(),
                TextColumn::make('amount')
                    ->money()
                    ->sortable(),
                TextColumn::make('balance_after')
                    ->money()
                    ->sortable(),
                TextColumn::make('description')
                    ->limit(50)
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ]);
    }
}
