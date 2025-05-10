package it.trankovan.geomark.service;

import it.trankovan.geomark.mapper.GeometricObjectMapper;
import it.trankovan.geomark.model.GeometricObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GeometricObjectService {
    
    private final GeometricObjectMapper geometricObjectMapper;
    
    public GeometricObjectService(GeometricObjectMapper geometricObjectMapper) {
        this.geometricObjectMapper = geometricObjectMapper;
    }
    
    public List<GeometricObject> findAll() {
        return geometricObjectMapper.findAll();
    }
    
    public GeometricObject findById(Long id) {
        return geometricObjectMapper.findById(id);
    }
    
    @Transactional
    public GeometricObject create(GeometricObject object) {
        geometricObjectMapper.insert(object);
        return object;
    }
    
    @Transactional
    public GeometricObject update(Long id, GeometricObject object) {
        object.setId(id);
        geometricObjectMapper.update(object);
        return findById(id);
    }
    
    @Transactional
    public void delete(Long id) {
        geometricObjectMapper.delete(id);
    }
} 