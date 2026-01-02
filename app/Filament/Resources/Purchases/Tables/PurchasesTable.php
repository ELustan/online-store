<?php

namespace App\Filament\Resources\Purchases\Tables;

use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PurchasesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('payment_reference')
                    ->searchable(),
                TextColumn::make('user.name')
                    ->label('Customer')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge()
                    ->sortable(),
                TextColumn::make('amount_due')
                    ->money()
                    ->sortable(),
                TextColumn::make('cashback_total')
                    ->money()
                    ->sortable(),
                TextColumn::make('items_count')
                    ->counts('items')
                    ->label('Items'),
                TextColumn::make('purchased_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }
}
