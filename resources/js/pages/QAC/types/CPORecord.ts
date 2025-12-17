export interface CPORecord {
    id: number;
    date: string;

    tank1_oil_level?: string | number;
    tank1_temperature?: string | number;
    tank1_cpo_volume?: string | number;
    tank1_ffa?: string | number;
    tank1_moisture?: string | number;
    tank1_dobi?: string | number;
    tank1_top_ffa?: string | number;
    tank1_top_moisture?: string | number;
    tank1_top_dobi?: string | number;
    tank1_bottom_ffa?: string | number;
    tank1_bottom_moisture?: string | number;
    tank1_bottom_dobi?: string | number;

    tank2_oil_level?: string | number;
    tank2_temperature?: string | number;
    tank2_cpo_volume?: string | number;
    tank2_ffa?: string | number;
    tank2_moisture?: string | number;
    tank2_dobi?: string | number;
    tank2_top_ffa?: string | number;
    tank2_top_moisture?: string | number;
    tank2_top_dobi?: string | number;
    tank2_bottom_ffa?: string | number;
    tank2_bottom_moisture?: string | number;
    tank2_bottom_dobi?: string | number;

    tank3_oil_level?: string | number;
    tank3_temperature?: string | number;
    tank3_cpo_volume?: string | number;
    tank3_ffa?: string | number;
    tank3_moisture?: string | number;
    tank3_dobi?: string | number;
    tank3_top_ffa?: string | number;
    tank3_top_moisture?: string | number;
    tank3_top_dobi?: string | number;
    tank3_bottom_ffa?: string | number;
    tank3_bottom_moisture?: string | number;
    tank3_bottom_dobi?: string | number;

    tank4_oil_level?: string | number;
    tank4_temperature?: string | number;
    tank4_cpo_volume?: string | number;
    tank4_ffa?: string | number;
    tank4_moisture?: string | number;
    tank4_dobi?: string | number;
    tank4_top_ffa?: string | number;
    tank4_top_moisture?: string | number;
    tank4_top_dobi?: string | number;
    tank4_bottom_ffa?: string | number;
    tank4_bottom_moisture?: string | number;
    tank4_bottom_dobi?: string | number;

    total_cpo?: string | number;
    ffa_cpo?: string | number;
    dobi_cpo?: string | number;
    cs1_cm?: string | number;
    undilute_1?: string | number;
    undilute_2?: string | number;
    setting?: string | number;
    clean_oil?: string | number;
    skim?: string | number;
    mix?: string | number;
    loop_back?: string | number;

    // Production mode
    production_mode?: 'production' | 'no_production';
    
    // Tank sales (for no-production mode)
    tank1_sale?: string | number;
    tank2_sale?: string | number;
    tank3_sale?: string | number;
    tank4_sale?: string | number;
}
