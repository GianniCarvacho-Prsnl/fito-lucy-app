import React from 'react';
import { Pet } from '../../services/calendarService';

interface PetCardsProps {
  pets: Pet[];
  selectedPetId: string | null;
  onPetSelect: (petId: string | null) => void;
}

const PetCards: React.FC<PetCardsProps> = ({ pets, selectedPetId, onPetSelect }) => {
  // Color por defecto para la opción "Todas"
  const allPetsColor = '#3788d8';
  
  return (
    <div className="flex flex-wrap gap-3 mb-4 overflow-x-auto py-2">
      <div 
        className={`flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border transition-all duration-200 shadow-sm hover:shadow-md`}
        onClick={() => onPetSelect(null)}
        style={{ 
          minWidth: '90px',
          borderColor: selectedPetId === null ? allPetsColor : '#e5e7eb',
          backgroundColor: selectedPetId === null ? `${allPetsColor}20` : 'white',
          boxShadow: selectedPetId === null ? `0 0 0 2px ${allPetsColor}40` : 'none',
          transform: selectedPetId === null ? 'translateY(-2px)' : 'none'
        }}
      >
        {selectedPetId === null && (
          <div 
            className="absolute top-0 left-0 right-0 h-2 rounded-t-lg" 
            style={{ backgroundColor: allPetsColor }}
          ></div>
        )}
        <div className="text-2xl mb-1">🐾</div>
        <div className="text-sm font-medium">Todas</div>
      </div>

      {pets.map((pet) => (
        <div
          key={pet.id}
          className={`flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer border transition-all duration-200 shadow-sm hover:shadow-md`}
          onClick={() => onPetSelect(pet.id)}
          style={{ 
            minWidth: '90px',
            borderColor: selectedPetId === pet.id ? pet.associated_color : '#e5e7eb',
            backgroundColor: selectedPetId === pet.id ? `${pet.associated_color}20` : 'white',
            boxShadow: selectedPetId === pet.id ? `0 0 0 2px ${pet.associated_color}40` : 'none',
            transform: selectedPetId === pet.id ? 'translateY(-2px)' : 'none'
          }}
        >
          {selectedPetId === pet.id && (
            <div 
              className="absolute top-0 left-0 right-0 h-2 rounded-t-lg" 
              style={{ backgroundColor: pet.associated_color }}
            ></div>
          )}
          <div className="text-2xl mb-1">
            {pet.species === 'Perro' ? '🐶' : pet.species === 'Gato' ? '🐱' : '🐾'}
          </div>
          <div className="text-sm font-medium">{pet.name}</div>
        </div>
      ))}
    </div>
  );
};

export default PetCards; 