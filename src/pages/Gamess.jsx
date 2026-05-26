import { useState } from "react";
import Preguntados from "./Preguntados"
import Roullette from "./Roullette";
const games = [
    {
        name: "Tattoo Gacha",
        description: "Tirá del gacha y descubrí tu personaje ideal para tatuarte.",
        key: "gacha",
        image: "https://i.imgur.com/yOAdKcT.png",
    },
    {
        name: "Ruleta Promocional",
        description: "Girá la ruleta y ganá descuentos en tatuajes.",
        key: "ruleta",
        image: "https://i.imgur.com/ZH1t5Fq.png",
    },

    {
        name: "Preguntados",
        description: "Realiza una trivia de tattoos y gana.",
        key: "preguntados",
        image: "https://i.imgur.com/ZH1t5Fq.png",
    },
];

export default function GamesGrid() {
    const [selectedGame, setSelectedGame] = useState(null);

    const renderGame = () => {
        switch (selectedGame) {
     
            case "ruleta":
                return <Roullette />;
            case "preguntados":
                return <Preguntados />;
            default:
                return null;
        }
    };

    if (selectedGame) return renderGame();

    return (
        <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
            <h1 className="text-4xl font-bold text-center mb-10">Juegos de NHStudio</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {games.map((game) => (
                    <button
                        key={game.key}
                        onClick={() => setSelectedGame(game.key)}
                        className="bg-gray-800 hover:bg-gray-700 transition-all rounded-xl shadow-lg overflow-hidden group text-left"
                    >
                        <img
                            src={game.image}
                            alt={game.name}
                            className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-2">{game.name}</h2>
                            <p className="text-gray-300">{game.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
