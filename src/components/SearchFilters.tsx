import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, MapPin, DollarSign, Calendar } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
}

interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  categoryId: string | null;
  city: string;
  minBudget: number | null;
  maxBudget: number | null;
  urgencyLevel: string | null;
  sortBy: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'urgency';
}

const CITIES = [
  "Uberlândia",
  "Uberaba",
  "Araguari",
  "Patos de Minas",
  "Ituiutaba",
  "Monte Carmelo",
  "Araxá",
];

export function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categoryId: null,
    city: '',
    minBudget: null,
    maxBudget: null,
    urgencyLevel: null,
    sortBy: 'newest',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("service_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (data) setCategories(data);
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryId: null,
      city: '',
      minBudget: null,
      maxBudget: null,
      urgencyLevel: null,
      sortBy: 'newest',
    });
  };

  const activeFiltersCount = [
    filters.categoryId,
    filters.city,
    filters.minBudget,
    filters.maxBudget,
    filters.urgencyLevel,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categoria
                </label>
                <Select
                  value={filters.categoryId || ''}
                  onValueChange={(value) => updateFilter('categoryId', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Cidade
                </label>
                <Select
                  value={filters.city}
                  onValueChange={(value) => updateFilter('city', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as cidades</SelectItem>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Urgência */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Urgência
                </label>
                <Select
                  value={filters.urgencyLevel || ''}
                  onValueChange={(value) => updateFilter('urgencyLevel', value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="1">Baixa</SelectItem>
                    <SelectItem value="2">Média</SelectItem>
                    <SelectItem value="3">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Orçamento Mínimo */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Orçamento Mínimo
                </label>
                <Input
                  type="number"
                  placeholder="R$ 0"
                  value={filters.minBudget || ''}
                  onChange={(e) => updateFilter('minBudget', e.target.value ? Number(e.target.value) : null)}
                />
              </div>

              {/* Orçamento Máximo */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Orçamento Máximo
                </label>
                <Input
                  type="number"
                  placeholder="R$ 0"
                  value={filters.maxBudget || ''}
                  onChange={(e) => updateFilter('maxBudget', e.target.value ? Number(e.target.value) : null)}
                />
              </div>

              {/* Ordenar Por */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordenar Por</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => updateFilter('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais Recentes</SelectItem>
                    <SelectItem value="oldest">Mais Antigos</SelectItem>
                    <SelectItem value="price_asc">Menor Orçamento</SelectItem>
                    <SelectItem value="price_desc">Maior Orçamento</SelectItem>
                    <SelectItem value="urgency">Mais Urgentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
