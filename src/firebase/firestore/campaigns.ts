import { getFirestore, collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase/index';
import { RegionWorldbuildingData } from '@/types/worldbuilding';

export async function saveGeneratedWorldRegion(
    data: RegionWorldbuildingData,
    campaignName: string = "Nova Campanha Sandbox"
): Promise<string> {
    const { auth, firestore } = initializeFirebase();
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Usuário não autenticado. É necessário estar logado para salvar o mundo.');
    }

    const userId = user.uid;
    const batch = writeBatch(firestore);

    // 1. Criar a raiz da Campanha
    const campaignRef = doc(collection(firestore, `users/${userId}/campaigns`));
    const campaignId = campaignRef.id;

    batch.set(campaignRef, {
        ...data.overview,
        id: campaignId,
        name: campaignName,
        ownerId: userId,
        createdAt: serverTimestamp(),
        history: data.history,
        politics: data.politics,
        religion: data.religion,
        calendar: data.calendar,
        activeConflicts: data.activeConflicts,
        adventureHooks: data.adventureHooks,
        worldSecrets: data.worldSecrets,
    });

    // 2. Salvar Factions em subcoleção
    data.factions.forEach((faction) => {
        const factionRef = doc(collection(firestore, `users/${userId}/campaigns/${campaignId}/factions`));
        batch.set(factionRef, {
            ...faction,
            id: factionRef.id,
            ownerId: userId, // Importante pelas Regras de Segurança
            createdAt: serverTimestamp(),
        });
    });

    // 3. Salvar NPCs em subcoleção
    data.npcs.forEach((npc) => {
        const npcRef = doc(collection(firestore, `users/${userId}/campaigns/${campaignId}/npcs`));
        batch.set(npcRef, {
            ...npc,
            id: npcRef.id,
            ownerId: userId,
            createdAt: serverTimestamp(),
        });
    });

    // 4. Salvar Locations em subcoleção
    data.locations.forEach((location) => {
        const locationRef = doc(collection(firestore, `users/${userId}/campaigns/${campaignId}/locations`));
        batch.set(locationRef, {
            ...location,
            id: locationRef.id,
            ownerId: userId,
            createdAt: serverTimestamp(),
        });
    });

    // Commit em lote (todas as operações ou nenhuma)
    await batch.commit();

    return campaignId;
}
