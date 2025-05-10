package it.trankovan.geomark.controller;

import it.trankovan.geomark.model.GeometricObject;
import it.trankovan.geomark.service.GeometricObjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/geometric-objects")
@CrossOrigin(origins = "*")
public class        GeometricObjectController {
    
    private final GeometricObjectService geometricObjectService;
    
    public GeometricObjectController(GeometricObjectService geometricObjectService) {
        this.geometricObjectService = geometricObjectService;
    }
    
    @GetMapping
    public ResponseEntity<List<GeometricObject>> getAll() {
        return ResponseEntity.ok(geometricObjectService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<GeometricObject> getById(@PathVariable Long id) {
        return ResponseEntity.ok(geometricObjectService.findById(id));
    }
    
    @PostMapping
    public ResponseEntity<GeometricObject> create(@RequestBody GeometricObject object) {
        return ResponseEntity.ok(geometricObjectService.create(object));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<GeometricObject> update(@PathVariable Long id, @RequestBody GeometricObject object) {
        return ResponseEntity.ok(geometricObjectService.update(id, object));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        geometricObjectService.delete(id);
        return ResponseEntity.ok().build();
    }
} 