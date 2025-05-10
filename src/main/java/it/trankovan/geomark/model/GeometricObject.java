package it.trankovan.geomark.model;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GeometricObject {
    private Long id;
    private String name;
    private String type;
    private JsonNode coordinates;
    private JsonNode properties;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 