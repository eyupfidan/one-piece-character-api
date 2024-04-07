<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('characters', function (Blueprint $table) {
            $table->id();
            $table->string('japanese_name')->nullable();
            $table->string('romanized_name')->nullable();
            $table->string('official_english_name')->nullable();
            $table->string('debut')->nullable();
            $table->string('affiliations')->nullable();
            $table->string('occupations')->nullable();
            $table->string('status')->nullable();
            $table->date('birthday')->nullable();
            $table->string('japanese_va')->nullable();
            $table->string('funi_english_va')->nullable();
            $table->string('residence')->nullable();
            $table->string('epithet')->nullable();
            $table->integer('age')->nullable();
            $table->integer('height')->nullable();
            $table->string('blood_type')->nullable();
            $table->bigInteger('bounty')->nullable();
            $table->string('odex_english_va')->nullable();
            $table->string('four_kids_english_va')->nullable();
            $table->string('origin')->nullable();
            $table->string('alias')->nullable();
            $table->string('real_name')->nullable();
            $table->string('english_name')->nullable();
            $table->string('type')->nullable();
            $table->string('meaning')->nullable();
            $table->integer('size')->nullable();
            $table->integer('weight')->nullable();
            $table->string('first_appearance')->nullable();
            $table->integer('age_at_death')->nullable();
            $table->integer('zombie_number')->nullable();
            $table->string('region')->nullable();
            $table->integer('gladiator_number')->nullable();
            $table->text('features')->nullable();
            $table->string('literal_meaning')->nullable();
            $table->string('captain')->nullable();
            $table->bigInteger('total_bounty')->nullable();
            $table->string('cp9_key')->nullable();
            $table->string('affiliation')->nullable();
            $table->date('completion_date')->nullable();
            $table->text('affiliates')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('characters');
    }
};
