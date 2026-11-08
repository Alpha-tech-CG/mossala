import {
  AirVent, Amphora, Anvil, AppWindow, Armchair, Axe, BedDouble, Bike, Bird, Box, BrickWall, Brush,
  Bug, CakeSlice, Camera, Candy, Car, Carrot, CircleDot, Cog, Columns3, Construction, CookingPot,
  Cpu, CupSoda, DoorClosed, DoorOpen, Drum, Droplets, Factory, Fence, Fish, Flame, Flower2,
  Footprints, Frame, Gem, Grid3x3, Hammer, Hand, HandHeart, House, IceCreamCone, KeyRound,
  Laptop, Layers, Mountain, PaintRoller, Palette, PartyPopper, PawPrint, PenTool, PiggyBank,
  Pickaxe, Printer, Refrigerator, Ruler, Scissors, Shirt, Shovel, ShoppingBag, ShoppingBasket,
  Smartphone, Snowflake, Sofa, SolarPanel, Sparkles, SprayCan, Sprout, Stamp, Sun, TreePine, Truck,
  Tv, Umbrella, WashingMachine, Watch, Wheat, Wrench, Zap, Donut, Ham, Shapes, Spool, Crown,
  Sailboat, PlugZap, type LucideIcon,
} from "lucide-react";

/**
 * Icône de chaque métier, choisie par mots-clés (du plus précis au plus général).
 * Un nouveau métier sans correspondance prend l'icône de sa catégorie.
 */
const regles: [RegExp, LucideIcon][] = [
  // Bâtiment
  [/aide-macon/, Shovel],
  [/macon|constructeur/, BrickWall],
  [/carreleur/, Grid3x3],
  [/platrier|staffeur/, Layers],
  [/peintre en batiment/, PaintRoller],
  [/plombier/, Droplets],
  [/vitrier/, AppWindow],
  [/couvreur/, House],
  [/ferrailleur/, Columns3],
  [/faux plafonds/, Layers],
  [/cloisons/, BrickWall],
  [/etancheur/, Umbrella],
  [/terrassier/, Pickaxe],
  [/aluminium/, AppWindow],
  // Mécanique & auto
  [/moto/, Bike],
  [/velo/, Bike],
  [/poids lourds/, Truck],
  [/engins de chantier/, Construction],
  [/electricien automobile/, PlugZap],
  [/electronicien automobile/, Cpu],
  [/tolier|carrossier/, Car],
  [/peintre automobile/, SprayCan],
  [/vulcanisateur|pneus/, CircleDot],
  [/soudeur automobile/, Flame],
  [/moteurs/, Cog],
  [/groupes electrogenes/, Zap],
  [/mecanicien/, Wrench],
  // Bois & mobilier
  [/ebeniste|fabricant de meubles|restaurateur de meubles|reparateur de mobilier/, Armchair],
  [/charpentier$/, TreePine],
  [/sculpteur sur bois/, Axe],
  [/tapissier decorateur/, Sofa],
  [/tapissier|garnisseur/, Sofa],
  [/portes et fenetres/, DoorOpen],
  [/cercueils/, Box],
  [/menuisier/, Hammer],
  // Métal
  [/forgeron/, Anvil],
  [/ferronnier|grilles/, Fence],
  [/serrurier/, KeyRound],
  [/chaudronnier/, Factory],
  [/portails/, DoorClosed],
  [/charpentes metalliques|structures metalliques/, Construction],
  [/metallier/, Anvil],
  [/soudeur/, Flame],
  // Textile
  [/styliste/, PenTool],
  [/modeliste/, Ruler],
  [/brodeur|tricoteur|tisserand/, Spool],
  [/cordonnier|chaussures/, Footprints],
  [/maroquinier|sacs/, ShoppingBag],
  [/vetements|tailleur|couturier/, Shirt],
  // Alimentaire
  [/boulanger/, Wheat],
  [/patissier/, CakeSlice],
  [/chocolatier/, Candy],
  [/beignets/, Donut],
  [/jus/, CupSoda],
  [/manioc|chikwangue|foufou/, Carrot],
  [/poissons/, Fish],
  [/produits agricoles/, Factory],
  [/confitures/, CookingPot],
  [/charcutier/, Ham],
  [/glacier/, IceCreamCone],
  // Électricité & froid
  [/telephones/, Smartphone],
  [/ordinateurs|informatique/, Laptop],
  [/televiseurs/, Tv],
  [/frigoriste/, Snowflake],
  [/climatiseurs/, AirVent],
  [/refrigerateurs/, Refrigerator],
  [/panneaux solaires/, SolarPanel],
  [/energie solaire/, Sun],
  [/electromenagers/, WashingMachine],
  [/electronicien/, Cpu],
  [/electricien/, Zap],
  // Beauté
  [/barbier|coiffeur homme/, Scissors],
  [/coiffeuse|tresseuse/, Sparkles],
  [/perruqu/, Crown],
  [/estheticienne|maquilleur/, Brush],
  [/manucure/, Hand],
  [/pedicure/, Footprints],
  [/masseuse/, HandHeart],
  [/tatoueur/, PenTool],
  // Art & tradition
  [/pierre/, Mountain],
  [/potier|ceramiste/, Amphora],
  [/vannier|paniers|raphia|nattes/, ShoppingBasket],
  [/bijoutier|orfevre/, Gem],
  [/graveur/, PenTool],
  [/instruments de musique/, Drum],
  [/peintre artisanal/, Palette],
  [/objets decoratifs/, Shapes],
  // Agriculture
  [/maraicher/, Carrot],
  [/horticulteur/, Flower2],
  [/pepinieriste/, Sprout],
  [/volailles/, Bird],
  [/porcs/, PiggyBank],
  [/chevres/, PawPrint],
  [/pisciculteur/, Fish],
  [/apiculteur/, Bug],
  [/pecheur/, Sailboat],
  [/aliments pour animaux/, Wheat],
  // Autres services
  [/matelas/, BedDouble],
  [/horloges|montres/, Watch],
  [/photographe/, Camera],
  [/encadreur/, Frame],
  [/imprimeur|serigraphe/, Printer],
  [/tampons/, Stamp],
  [/tapis/, SprayCan],
  [/decorateur evenementiel/, PartyPopper],
];

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function iconeDuMetier(label: string): LucideIcon | undefined {
  const n = norm(label);
  return regles.find(([re]) => re.test(n))?.[1];
}
