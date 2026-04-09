import type { Request, Response } from 'express';
import { query } from '../services/dbService';

export async function exportFullJson(_req: Request, res: Response): Promise<void> {
  try {
    const [characters, details, crews] = await Promise.all([
      query('SELECT * FROM characters ORDER BY name'),
      query('SELECT * FROM character_details ORDER BY name'),
      query('SELECT * FROM crews ORDER BY name')
    ]);

    const detailMap = new Map(details.map((item: any) => [item.name, item]));
    const enrichedCharacters = characters.map((char: any) => ({ ...char, details: detailMap.get(char.name) || null }));

    res.json({
      exportedAt: new Date().toISOString(),
      totals: {
        characters: characters.length,
        details: details.length,
        crews: crews.length
      },
      characters: enrichedCharacters,
      crews
    });
  } catch (error) {
    console.error('Full export error:', error);
    res.status(500).json({ error: 'Tam veri dışa aktarma hatası' });
  }
}
