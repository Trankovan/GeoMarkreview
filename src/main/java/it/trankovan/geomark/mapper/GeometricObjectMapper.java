package it.trankovan.geomark.mapper;

import it.trankovan.geomark.model.GeometricObject;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface GeometricObjectMapper {
    
    @Select("SELECT * FROM geometric_objects")
    @Results({
        @Result(property = "coordinates", column = "coordinates", typeHandler = it.trankovan.geomark.config.JsonNodeTypeHandler.class),
        @Result(property = "properties", column = "properties", typeHandler = it.trankovan.geomark.config.JsonNodeTypeHandler.class),
        @Result(property = "createdAt", column = "created_at", typeHandler = it.trankovan.geomark.config.LocalDateTimeTypeHandler.class),
        @Result(property = "updatedAt", column = "updated_at", typeHandler = it.trankovan.geomark.config.LocalDateTimeTypeHandler.class)
    })
    List<GeometricObject> findAll();
    
    @Select("SELECT * FROM geometric_objects WHERE id = #{id}")
    @Results({
        @Result(property = "coordinates", column = "coordinates", typeHandler = it.trankovan.geomark.config.JsonNodeTypeHandler.class),
        @Result(property = "properties", column = "properties", typeHandler = it.trankovan.geomark.config.JsonNodeTypeHandler.class),
        @Result(property = "createdAt", column = "created_at", typeHandler = it.trankovan.geomark.config.LocalDateTimeTypeHandler.class),
        @Result(property = "updatedAt", column = "updated_at", typeHandler = it.trankovan.geomark.config.LocalDateTimeTypeHandler.class)
    })
    GeometricObject findById(Long id);
    
    @Insert("INSERT INTO geometric_objects (name, type, coordinates, properties) " +
            "VALUES (#{name}, #{type}, #{coordinates,typeHandler=it.trankovan.geomark.config.JsonNodeTypeHandler}, " +
            "#{properties,typeHandler=it.trankovan.geomark.config.JsonNodeTypeHandler})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(GeometricObject object);
    
    @Update("UPDATE geometric_objects SET name = #{name}, type = #{type}, " +
            "coordinates = #{coordinates,typeHandler=it.trankovan.geomark.config.JsonNodeTypeHandler}, " +
            "properties = #{properties,typeHandler=it.trankovan.geomark.config.JsonNodeTypeHandler}, " +
            "updated_at = CURRENT_TIMESTAMP WHERE id = #{id}")
    void update(GeometricObject object);
    
    @Delete("DELETE FROM geometric_objects WHERE id = #{id}")
    void delete(Long id);
} 