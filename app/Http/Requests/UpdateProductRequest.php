<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'discount_percent' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'cashback_percent' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'promo_label' => ['sometimes', 'nullable', 'string', 'max:60'],
            'promo_expires_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
